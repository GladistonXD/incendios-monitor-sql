<?php
// Configuração do banco de dados MySQL
$host = 'localhost';
$dbname = 'fire_incidents_system';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    // Se o banco não existir, criar
    try {
        $pdo_temp = new PDO("mysql:host=$host;charset=utf8", $username, $password);
        $pdo_temp->exec("CREATE DATABASE IF NOT EXISTS $dbname");
        
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Criar tabela para incêndios
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS occurrences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                image LONGTEXT NOT NULL COMMENT 'Foto do incêndio em base64',
                comment TEXT NOT NULL COMMENT 'Descrição do incêndio',
                status VARCHAR(50) DEFAULT 'Não resolvido' COMMENT 'Ativo ou Controlado',
                category VARCHAR(50) NOT NULL COMMENT 'Tipo de incêndio',
                priority VARCHAR(20) NOT NULL COMMENT 'Intensidade do incêndio',
                latitude DECIMAL(10, 8) NULL COMMENT 'Latitude do foco',
                longitude DECIMAL(11, 8) NULL COMMENT 'Longitude do foco',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_category (category),
                INDEX idx_priority (priority),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Registro de incêndios'
        ");
        
    } catch(PDOException $e2) {
        die("Erro de conexão: " . $e2->getMessage());
    }
}
?>
