<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');

$envFile = __DIR__ . '/../nodeapp/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

function sshExecute($command) {
    $dropletIp = $_ENV['DROPLET_IP'] ?? '157.230.72.195';
    $sshPassword = $_ENV['DROPLET_SSH_PASSWORD'] ?? null;
    
    $connection = ssh2_connect($dropletIp, 22);
    ssh2_auth_password($connection, 'root', $sshPassword);
    $stream = ssh2_exec($connection, $command);
    stream_set_blocking($stream, true);
    $output = stream_get_contents($stream);
    fclose($stream);
    return trim($output);
}

function startPlaying($character, $state) {
    $apiDomain = $_ENV['API_DOMAIN'] ?? 'cimai.biz';
    $hostUrl = "https://$apiDomain";
    
    // Create a unique play session ID
    $playId = uniqid($character . '_play_');
    
    // Construct model path based on character and state
    $modelName = "mk2_{$character}_" . str_replace('.state', '', $state);
    $modelPath = "/var/www/cimai/docker_emulator/models/{$modelName}.zip";
    
    $command = "export HOST_URL=$hostUrl && " .
               "source /root/miniconda/etc/profile.d/conda.sh && " .
               "conda activate retro_env && " .
               "nohup python /var/www/cimai/docker_emulator/custom_scripts/model_trainer.py " .
               "--character " . escapeshellarg($character) . " " .
               "--state " . escapeshellarg($state) . " " .
               "--load_model " . escapeshellarg($modelPath) . " " .
               "--play --stream " .
               "> /var/www/cimai/logs/play_$playId.log 2>&1 & echo $!";

    $pid = sshExecute($command);

    // Monitor stream setup
    $timeout = 60; // 1 minute timeout for play setup
    $checkInterval = 2; // Check every 2 seconds
    $streamReady = false;
    $streamUrl = "https://stream.{$apiDomain}/hls/{$character}/{$state}/stream.m3u8";

    for ($i = 0; $i < $timeout; $i += $checkInterval) {
        // Check if stream is ready
        $checkCommand = "ls /var/www/cimai/hls/{$character}/{$state}/stream.m3u8 2>/dev/null";
        $result = sshExecute($checkCommand);
        
        if (!empty($result)) {
            $streamReady = true;
            echo "data: " . json_encode([
                'status' => 'stream_ready',
                'streamUrl' => $streamUrl
            ]) . "\n\n";
            ob_flush();
            flush();
            break;
        }
        
        // Check for any errors in the log
        $logCommand = "tail -n 20 /var/www/cimai/logs/play_$playId.log";
        $logContent = sshExecute($logCommand);
        
        if (strpos($logContent, 'ERROR') !== false) {
            echo "data: " . json_encode([
                'status' => 'error',
                'message' => 'Error starting playback',
                'log' => $logContent
            ]) . "\n\n";
            ob_flush();
            flush();
            break;
        }
        
        // Send periodic updates
        echo "data: " . json_encode([
            'status' => 'initializing',
            'message' => 'Setting up playback stream...'
        ]) . "\n\n";
        ob_flush();
        flush();
        
        sleep($checkInterval);
    }

    // Monitor gameplay
    while ($streamReady) {
        // Check if process is still running
        $checkPidCommand = "ps -p $pid > /dev/null && echo 'running'";
        $processStatus = sshExecute($checkPidCommand);
        
        if (empty($processStatus)) {
            echo "data: " . json_encode([
                'status' => 'complete',
                'message' => 'Playback completed'
            ]) . "\n\n";
            ob_flush();
            flush();
            break;
        }
        
        // Check for new frames/segments
        $segmentCommand = "ls -1 /var/www/cimai/hls/{$character}/{$state}/*.ts 2>/dev/null | wc -l";
        $segmentCount = sshExecute($segmentCommand);
        
        echo "data: " . json_encode([
            'status' => 'playing',
            'segments' => intval($segmentCount)
        ]) . "\n\n";
        ob_flush();
        flush();
        
        sleep(1);
    }

    return [
        'status' => $streamReady ? 'active' : 'failed',
        'message' => $streamReady ? 'Playback active' : 'Failed to start playback',
        'streamUrl' => $streamUrl,
        'playId' => $playId
    ];
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $character = $data['character'] ?? '';
    $state = $data['state'] ?? '';
    
    if (empty($character) || empty($state)) {
        throw new Exception('Character and state are required');
    }
    
    $result = startPlaying($character, $state);
    echo "data: " . json_encode([
        'success' => true,
        'message' => $result['message'],
        'status' => $result['status'],
        'streamUrl' => $result['streamUrl'],
        'playId' => $result['playId'],
        'hostUrl' => "https://" . ($_ENV['API_DOMAIN'] ?? 'cimai.biz')
    ]) . "\n\n";
    
} catch (Exception $e) {
    echo "data: " . json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]) . "\n\n";
}