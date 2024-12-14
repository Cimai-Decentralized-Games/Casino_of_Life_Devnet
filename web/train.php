<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

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

function startTraining($character, $state, $numTimesteps) {
    $apiDomain = $_ENV['API_DOMAIN'] ?? 'cimai.biz';
    $hostUrl = "https://$apiDomain";
    
    $trainingId = uniqid($character . '_');
    
    $command = "export HOST_URL=$hostUrl && " .
               "source /root/miniconda/etc/profile.d/conda.sh && " .
               "conda activate retro_env && " .
               "cd /var/www/cimai/docker_emulator && " .
               "nohup python custom_scripts/model_trainer.py " .
               "--character " . escapeshellarg($character) . " " .
               "--state " . escapeshellarg($state) . " " .
               "--num_env 1 " .
               "--num_timesteps " . intval($numTimesteps) . " " .
               "--record " .
               "> /var/www/cimai/logs/training_$trainingId.log 2>&1 & echo $!";

    $pid = sshExecute($command);
    
    if (!is_numeric($pid)) {
        throw new Exception("Failed to start training process: $pid");
    }
    
    return [
        'success' => true,
        'trainingId' => $trainingId,
        'pid' => $pid
    ];
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }
    
    error_log("Received training request: " . json_encode($data));
    
    $character = $data['character'] ?? '';
    $state = $data['state'] ?? '';
    $numTimesteps = $data['numTimesteps'] ?? 1000000;  // Changed from num_timesteps to numTimesteps
    
    if (empty($character) || empty($state)) {
        throw new Exception('Character and state are required');
    }
    
    $result = startTraining($character, $state, $numTimesteps);
    echo json_encode($result);
    
} catch (Exception $e) {
    error_log("Training error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}