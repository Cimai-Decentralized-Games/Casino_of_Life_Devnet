<?php
header('Content-Type: application/octet-stream');

$modelPath = $_GET['path'] ?? '';
if (empty($modelPath)) {
    http_response_code(400);
    die('Model path is required');
}

// Validate the path is within allowed directory
if (strpos($modelPath, '..') !== false) {
    http_response_code(403);
    die('Invalid path');
}

// Get the model file from the droplet
$dropletIp = $_ENV['DROPLET_IP'] ?? '157.230.72.195';
$sshPassword = $_ENV['DROPLET_SSH_PASSWORD'] ?? null;

$connection = ssh2_connect($dropletIp, 22);
ssh2_auth_password($connection, 'root', $sshPassword);

$sftp = ssh2_sftp($connection);
$stream = fopen("ssh2.sftp://$sftp$modelPath", 'r');

if (!$stream) {
    http_response_code(404);
    die('Model file not found');
}

// Stream the file to the client
while (!feof($stream)) {
    echo fread($stream, 8192);
}

fclose($stream);