<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Keep env loading
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

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://cimai.biz');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Session-ID');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Method not allowed');
    }

    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate request type
    if (!isset($data['type'])) {
        throw new Exception('Request type is required');
    }

    // Get session ID from header or generate new one
    $sessionId = $_SERVER['HTTP_X_SESSION_ID'] ?? uniqid();
    
    $dropletIp = $_ENV['DROPLET_IP'] ?? '157.230.72.195';
    
    // Handle different request types
    if ($data['type'] === 'training') {
        // Validate training-specific fields
        $requiredFields = ['fighter', 'state', 'policy', 'strategy', 'save_state'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                throw new Exception("$field is required for training");
            }
        }

        // Send to training endpoint
        $ch = curl_init("http://$dropletIp:6000/train");  // Note: Using port 6000 for training service
    } else {
        // Regular chat request
        if (!isset($data['message'])) {
            throw new Exception('Message is required for chat');
        }
        
        // Send to chat endpoint
        $ch = curl_init("http://$dropletIp:5000/chat");
    }

    // Prepare request data
    $requestData = $data['type'] === 'training' ? [
        'fighter' => $data['fighter'],
        'state' => $data['state'],
        'policy' => $data['policy'],
        'strategy' => $data['strategy'],
        'save_state' => $data['save_state'],
        'training_params' => $data['training_params'] ?? [
            'learning_rate' => 0.001,
            'batch_size' => 64,
            'timesteps' => 1000000
        ]
    ] : [
        'message' => $data['message'],
        'characterId' => $data['characterId'] ?? 'default'
    ];

    // Set up cURL
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: text/event-stream',  // Added for SSE support
            'X-Session-ID: ' . $sessionId
        ],
        CURLOPT_POSTFIELDS => json_encode($requestData)
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($response === false) {
        throw new Exception('Service error: ' . curl_error($ch));
    }
    
    if ($httpCode !== 200) {
        throw new Exception('Service error: HTTP ' . $httpCode);
    }
    
    curl_close($ch);
    
    // Log the interaction
    error_log(sprintf(
        "Interaction - Type: %s, Session: %s, Data: %s",
        $data['type'],
        $sessionId,
        json_encode($requestData)
    ));
    
    // Parse SSE format if present
    if (strpos($response, 'data: ') === 0) {
        $jsonMatch = [];
        if (preg_match('/data: ({.*})/s', $response, $jsonMatch)) {
            $response = $jsonMatch[1];
        }
    }
    
    echo $response;
    
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}