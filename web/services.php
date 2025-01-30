<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Use the EXACT same env loading as startFight.php
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

// Use the EXACT same sshExecute function that works
function sshExecute($command) {
    $dropletIp = $_ENV['DROPLET_IP'] ?? '157.230.72.195';
    $sshPassword = $_ENV['DROPLET_SSH_PASSWORD'] ?? null;
    
    error_log("Attempting SSH connection to $dropletIp");
    $connection = ssh2_connect($dropletIp, 22, ['timeout' => 30]);
    if (!$connection) {
        throw new Exception("Failed to connect to $dropletIp");
    }
    
    error_log("SSH connection established, attempting authentication");
    if (!ssh2_auth_password($connection, 'root', $sshPassword)) {
        throw new Exception("Failed to authenticate");
    }
    
    error_log("Authentication successful, executing command: $command");
    $stream = ssh2_exec($connection, $command);
    if (!$stream) {
        throw new Exception("Failed to execute command");
    }
    
    stream_set_blocking($stream, true);
    $output = stream_get_contents($stream);
    fclose($stream);
    
    error_log("SSH command output: " . $output);
    return trim($output);
}

function startService($service) {
    if ($service === 'chat') {
        $command = "source /root/miniconda/etc/profile.d/conda.sh && " .
                  "conda activate retro_env && " .
                  "cd /var/www/cimai/casino-of-life && " .
                  "nohup python main.py > /var/log/cimai/chat.log 2>&1 & echo $!";
    } else if ($service === 'train') {
        $command = "source /root/miniconda/etc/profile.d/conda.sh && " .
                  "conda activate retro_env && " .
                  "cd /var/www/cimai/casino-of-life && " .
                  "nohup python main.py > /var/log/cimai/train.log 2>&1 & echo $!";
    } else {
        throw new Exception('Invalid service specified');
    }

    $pid = sshExecute($command);
    
    // Check if process is running
    $checkCommand = "ps aux | grep python | grep -v grep";
    $processStatus = sshExecute($checkCommand);
    
    return [
        'status' => !empty($processStatus) ? 'active' : 'failed',
        'message' => !empty($processStatus) ? "Service $service started" : "Failed to start $service",
        'pid' => $pid
    ];
}

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('Access-Control-Allow-Origin: https://cimai.biz');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Session-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $service = $data['service'] ?? '';
    
    if (!in_array($service, ['chat', 'train'])) {
        throw new Exception('Invalid service specified');
    }
    
    $result = startService($service);
    
    echo "data: " . json_encode([
        'success' => true,
        'message' => $result['message'],
        'status' => $result['status'],
        'pid' => $result['pid']
    ]) . "\n\n";
    
} catch (Exception $e) {
    error_log("Service error: " . $e->getMessage());
    echo "data: " . json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]) . "\n\n";
}