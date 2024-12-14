<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Load environment variables
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
    
    // Add error logging to track which command is being executed
    error_log("Executing command: " . $command);
    
    // Try to establish connection with retries
    $maxRetries = 3;
    $retryDelay = 1; // seconds
    
    for ($i = 0; $i < $maxRetries; $i++) {
        $connection = @ssh2_connect($dropletIp, 22);
        if ($connection) {
            break;
        }
        if ($i < $maxRetries - 1) {
            error_log("SSH connection attempt " . ($i + 1) . " failed, retrying...");
            sleep($retryDelay);
        }
    }
    
    if (!$connection) {
        throw new Exception('Failed to connect to droplet after ' . $maxRetries . ' attempts');
    }
    
    if (!@ssh2_auth_password($connection, 'root', $sshPassword)) {
        throw new Exception('SSH authentication failed');
    }
    
    // Execute the command with proper environment setup
    $stream = ssh2_exec($connection, "bash -l -c " . escapeshellarg($command));
    if (!$stream) {
        throw new Exception('Failed to execute command');
    }
    
    // Get both stdout and stderr
    $errorStream = ssh2_fetch_stream($stream, SSH2_STREAM_STDERR);
    stream_set_blocking($stream, true);
    stream_set_blocking($errorStream, true);
    
    $output = stream_get_contents($stream);
    $errorOutput = stream_get_contents($errorStream);
    
    // Log any error output
    if ($errorOutput) {
        error_log("Command stderr: " . $errorOutput);
    }
    
    fclose($errorStream);
    fclose($stream);
    
    // Close the connection explicitly
    unset($connection);
    
    return trim($output);
}

header('Content-Type: application/json');

try {
    // Check if it's a FormData request or JSON request
    $contentType = $_SERVER["CONTENT_TYPE"] ?? '';
    
    if (strpos($contentType, 'multipart/form-data') !== false) {
        // Handle FormData (for metadata and store operations)
        $modelData = json_decode($_POST['modelData'], true);
        
        // Handle file uploads if present
        $modelFile = null;
        $imageFile = null;
        
        if (isset($_FILES['model'])) {
            $modelFile = file_get_contents($_FILES['model']['tmp_name']);
        }
        
        if (isset($_FILES['image'])) {
            $imageFile = file_get_contents($_FILES['image']['tmp_name']);
        }
    } else {
        // Handle JSON input (for validation)
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            throw new Exception('Invalid input');
        }
        $modelData = json_decode($input['modelData'], true);
        $modelFile = base64_decode($input['modelFile'] ?? '');
    }

    // Save the model file temporarily if it exists
    $tempModelPath = null;
    if ($modelFile) {
        $tempModelPath = tempnam(sys_get_temp_dir(), 'model_');
        if (file_put_contents($tempModelPath, $modelFile) === false) {
            throw new Exception('Failed to save temporary model file');
        }
    }

    // Prepare base command
    $apiDomain = $_ENV['API_DOMAIN'] ?? 'cimai.biz';
    $hostUrl = "https://$apiDomain";
    
    // Determine operation based on request
    $operation = '';
    if (isset($_POST['operation'])) {
        $operation = $_POST['operation'];
    } else if (isset($input['operation'])) {
        $operation = $input['operation'];
    }

    // Build command based on operation
    $baseCommand = "export HOST_URL=$hostUrl && " .
                  "source /root/miniconda/etc/profile.d/conda.sh && " .
                  "conda activate retro_env";

    switch ($operation) {
        case 'metadata':
            $pythonCommand = "python /var/www/cimai/docker_emulator/custom_scripts/generateMetadata.py " .
                            escapeshellarg(json_encode($modelData));
            if ($imageFile) {
                $tempImagePath = tempnam(sys_get_temp_dir(), 'image_');
                file_put_contents($tempImagePath, $imageFile);
                $pythonCommand .= " " . escapeshellarg($tempImagePath);
            }
            break;
            
        case 'store':
            $pythonCommand = "python /var/www/cimai/docker_emulator/custom_scripts/storeModel.py " .
                            escapeshellarg(json_encode($modelData)) .
                            ($tempModelPath ? " " . escapeshellarg($tempModelPath) : "");
            break;
            
        default:
            $pythonCommand = "python /var/www/cimai/docker_emulator/custom_scripts/modelValidate.py " .
                            escapeshellarg(json_encode($modelData)) .
                            ($tempModelPath ? " " . escapeshellarg($tempModelPath) : "");
    }

    $command = "$baseCommand && $pythonCommand";

    // Execute Python script
    $output = sshExecute($command);
    error_log("Command output: " . $output);

    // Process the result
    $result = json_decode($output, true);
    if ($result === null) {
        throw new Exception('Error processing request');
    }

    echo json_encode($result);

} catch (Exception $e) {
    error_log('Operation error: ' . $e->getMessage());
    echo json_encode(['error' => true, 'reason' => $e->getMessage()]);
} finally {
    // Clean up temporary files
    if (isset($tempModelPath) && file_exists($tempModelPath)) {
        unlink($tempModelPath);
    }
    if (isset($tempImagePath) && file_exists($tempImagePath)) {
        unlink($tempImagePath);
    }
}
