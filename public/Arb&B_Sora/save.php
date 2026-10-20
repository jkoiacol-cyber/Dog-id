<?php
// save.php - Soporta tanto POST JSON como parámetros GET
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Recoger datos ya sea por POST (JSON) o por GET (URL)
$data = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
}

// Si viene por GET o el JSON falló, intentamos leer los parámetros directos
if (empty($data) && !empty($_GET)) {
    $data = $_GET;
}

if (!empty($data)) {
    // Guardar en config.json
    file_put_contents('config.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(['status' => 'success', 'message' => 'Configuración guardada correctamente']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No se recibieron datos válidos']);
}
?>