<?php

declare(strict_types=1);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Invalid request method.']);
    exit;
}

if (!empty($_POST['website'])) {
    echo json_encode(['message' => 'Thank you. Your song request has been received.']);
    exit;
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$song = trim((string) ($_POST['song'] ?? ''));
$artist = trim((string) ($_POST['artist'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $song === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['message' => 'Please enter your name, a valid email address, and a song title.']);
    exit;
}

if (preg_match('/[\r\n]/', $name) || preg_match('/[\r\n]/', $song) || preg_match('/[\r\n]/', $artist)) {
    http_response_code(422);
    echo json_encode(['message' => 'Invalid characters were submitted.']);
    exit;
}

if (strlen($name) > 100 || strlen($email) > 254 || strlen($song) > 200 || strlen($artist) > 200 || strlen($message) > 2000) {
    http_response_code(422);
    echo json_encode(['message' => 'One or more fields are too long.']);
    exit;
}

$to = 'contact@sur420.com.au';
$subject = 'SUR420 Song Request: ' . $song;
$body = "New song request\n\n"
    . 'Name: ' . $name . "\n"
    . 'Email: ' . $email . "\n"
    . 'Song: ' . $song . "\n"
    . 'Artist: ' . ($artist !== '' ? $artist : 'Not provided') . "\n"
    . 'Dedication or message: ' . ($message !== '' ? $message : 'Not provided') . "\n";

$headers = [
    'From: SUR420 Website <no-reply@sur420.com.au>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'X-Mailer: PHP/' . phpversion(),
];

if (!mail($to, $subject, $body, implode("\r\n", $headers))) {
    http_response_code(500);
    echo json_encode(['message' => 'Your request could not be sent. Please try again later.']);
    exit;
}

echo json_encode(['message' => 'Thank you. Your song request has been received.']);
