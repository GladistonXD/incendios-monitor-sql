<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

try {
    // Total de ocorrências
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM occurrences");
    $total = $stmt->fetch()['count'];
    
    // Ocorrências resolvidas
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM occurrences WHERE status = 'Resolvido'");
    $stmt->execute();
    $resolved = $stmt->fetch()['count'];
    
    // Ocorrências urgentes
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM occurrences WHERE priority = 'urgente'");
    $stmt->execute();
    $urgent = $stmt->fetch()['count'];
    
    // Estatísticas por categoria
    $stmt = $pdo->query("
        SELECT 
            category,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Resolvido' THEN 1 ELSE 0 END) as resolved
        FROM occurrences 
        GROUP BY category
    ");
    $categories = $stmt->fetchAll();
    
    $stats = [
        'total' => (int)$total,
        'resolved' => (int)$resolved,
        'pending' => (int)($total - $resolved),
        'urgent' => (int)$urgent,
        'categories' => $categories
    ];
    
    echo json_encode($stats);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}
?>
