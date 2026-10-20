<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$data = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
}

if (empty($data) && !empty($_GET)) {
    $data = $_GET;
}

if (!empty($data)) {
    $resultado = file_put_contents('config.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if ($resultado !== false) {
        echo json_encode(['status' => 'success', 'message' => 'Configuración guardada correctamente']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No se pudo escribir el fichero config.json']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No se recibieron datos válidos']);
}
exit;
?>