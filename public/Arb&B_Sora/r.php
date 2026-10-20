<?php
// r.php - Redirección limpia para la TV
$params = $_GET;
$queryString = http_build_query($params);
header("Location: index.html?" . $queryString);
exit();
?>