<?php
// save.php - Guarda la configuración enviada desde admin.html
header('Content-Type: application/json');

// Permitir peticiones desde el formulario
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$json = file_get_contents('php://input');
if ($json) {
    file_put_contents('config.json', $json);
    echo json_encode(['status' => 'success', 'message' => 'Configuración guardada correctamente']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'No se recibieron datos']);
}
?>