<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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

function startFightAfterBetting($fightId, $secureId) {
    error_log("startFightAfterBetting function called with fightId: $fightId, secureId: $secureId");
    
    $apiDomain = $_ENV['API_DOMAIN'] ?? 'cimai.biz';
    $hostUrl = "https://$apiDomain";
    
    $command = "export HOST_URL=$hostUrl && " .
               "source /root/miniconda/etc/profile.d/conda.sh && " .
               "conda activate retro_env && " .
               "nohup python /var/www/cimai/docker_emulator/custom_scripts/run_fight_and_stream_prod.py " .
               "--env MortalKombatII-Genesis " .
               "--state Level1.LiuKangVsJax.2P.state " .
               "--load_p1_model /var/www/cimai/docker_emulator/models/LiuKang.pt " .
               "--load_p2_model /var/www/cimai/docker_emulator/models/LiuKang.pt " .
               "--num_rounds 3 " .
               "--fight_id $fightId " .
               "--secure_id $secureId " .
               "> /var/www/cimai/logs/fight_$fightId.log 2>&1 & echo $!";

    error_log("Executing command: $command");
    $pid = sshExecute($command);

    // Check if process is running using the new script name
    $checkProcessCommand = "ps aux | grep run_fight_and_stream_prod.py | grep -v grep";
    $processStatus = sshExecute($checkProcessCommand);
    error_log("Python process status: " . $processStatus);

    // Check the log file
    $checkStatusCommand = "tail -n 50 /var/www/cimai/logs/fight_$fightId.log";
    $status = sshExecute($checkStatusCommand);
    error_log("Initial fight status: " . $status);

    $streamUrl = "https://stream.{$apiDomain}/hls/$fightId/output.m3u8";

    return [
        'status' => !empty($processStatus) ? 'started' : 'failed',
        'message' => !empty($processStatus) ? 'Fight process started' : 'Failed to start fight process',
        'streamUrl' => $streamUrl,
        'sshOutput' => $pid,
        'initialStatus' => $status,
        'pythonProcessStatus' => $processStatus
    ];
}

header('Content-Type: application/json');

try {
    $fightId = $_POST['fightId'] ?? '';
    $secureId = $_POST['secureId'] ?? '';
    
    $result = startFightAfterBetting($fightId, $secureId);
    echo json_encode([
        'success' => true,
        'message' => $result['message'],
        'status' => $result['status'],
        'streamUrl' => $result['streamUrl'],
        'fightId' => $result['fightId'],
        'secureId' => $result['secureId'],
        'hostUrl' => "https://" . ($_ENV['API_DOMAIN'] ?? 'cimai.biz')
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
