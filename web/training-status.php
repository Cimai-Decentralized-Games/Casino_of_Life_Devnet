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

function getTrainingStatus($character, $state, $trainingId) {
    // Check if process is running
    $pidCommand = "ps aux | grep '[p]ython.*model_trainer.py.*" . escapeshellarg($trainingId) . "' | awk '{print $2}'";
    $pid = sshExecute($pidCommand);
    $isRunning = !empty($pid);
    
    // Get log file content
    $logFile = "/var/www/cimai/logs/training_{$trainingId}.log";
    $command = "if [ -f {$logFile} ]; then tail -n 50 {$logFile} 2>/dev/null || echo 'read_error'; else echo 'not_found'; fi";
    $logContent = sshExecute($command);
    
    if ($logContent === 'not_found') {
        return [
            'status' => $isRunning ? 'initializing' : 'not_found',
            'progress' => 0
        ];
    }
    
    if ($logContent === 'read_error') {
        return [
            'status' => $isRunning ? 'initializing' : 'error',
            'progress' => 0
        ];
    }
    
    // Process logs
    $logs = explode("\n", $logContent);
    $progress = 0;
    $hasStarted = false;
    $hasError = false;
    
    foreach ($logs as $line) {
        // Skip empty lines
        if (empty(trim($line))) {
            continue;
        }
        
        if (strpos($line, 'Start Training') !== false) {
            $hasStarted = true;
        }
        
        // Look for our specific progress format
        if (preg_match('/Progress: Step (\d+)\/(\d+) \(([0-9.]+)%\)/', $line, $matches)) {
            $progress = floatval($matches[3]);
        }
        
        if (strpos($line, 'ERROR') !== false) {
            $hasError = true;
        }
    }
    
    // Determine status
    $status = 'unknown';
    if ($hasError) {
        $status = 'error';
    } elseif ($isRunning && $hasStarted) {
        $status = 'training';
    } elseif ($isRunning && !$hasStarted) {
        $status = 'initializing';
    } elseif (!$isRunning && $progress >= 99.9) {
        $status = 'complete';
    } elseif (!$isRunning && $progress > 0) {
        $status = 'stopped';
    }
    
    // Only return essential information
    return [
        'status' => $status,
        'progress' => $progress
    ];
}

try {
    $character = $_GET['character'] ?? '';
    $state = $_GET['state'] ?? '';
    $trainingId = $_GET['trainingId'] ?? '';
    
    if (empty($character) || empty($state) || empty($trainingId)) {
        throw new Exception('Character, state, and trainingId are required');
    }
    
    $status = getTrainingStatus($character, $state, $trainingId);
    echo json_encode($status);
    
} catch (Exception $e) {
    error_log("Status check error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error' => $e->getMessage()
    ]);
}