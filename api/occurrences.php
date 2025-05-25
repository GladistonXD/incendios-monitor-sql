<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Parse URL to get ID if present
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
$id = null;

// Check for ID in URL or query parameter
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $id = (int)$_GET['id'];
} elseif (count($path_parts) >= 3 && is_numeric(end($path_parts))) {
    $id = (int)end($path_parts);
}

try {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single occurrence
                $stmt = $pdo->prepare("SELECT * FROM occurrences WHERE id = ?");
                $stmt->execute([$id]);
                $occurrence = $stmt->fetch();
                
                if ($occurrence) {
                    echo json_encode($occurrence);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Incêndio não encontrado']);
                }
            } else {
                // Get all occurrences with filters
                $query = "SELECT * FROM occurrences WHERE 1=1";
                $params = [];
                
                // Apply filters
                if (isset($_GET['status']) && !empty($_GET['status'])) {
                    $query .= " AND status = ?";
                    $params[] = $_GET['status'];
                }
                
                if (isset($_GET['category']) && !empty($_GET['category'])) {
                    $query .= " AND category = ?";
                    $params[] = $_GET['category'];
                }
                
                if (isset($_GET['priority']) && !empty($_GET['priority'])) {
                    $query .= " AND priority = ?";
                    $params[] = $_GET['priority'];
                }
                
                if (isset($_GET['search']) && !empty($_GET['search'])) {
                    $query .= " AND (comment LIKE ? OR category LIKE ? OR priority LIKE ?)";
                    $searchTerm = '%' . $_GET['search'] . '%';
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                }
                
                $query .= " ORDER BY created_at DESC";
                
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                $occurrences = $stmt->fetchAll();
                
                echo json_encode($occurrences);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['image']) || !isset($input['comment'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Imagem e comentário são obrigatórios']);
                break;
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO occurrences (image, comment, category, priority, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $input['image'],
                $input['comment'],
                $input['category'] ?? 'outros',
                $input['priority'] ?? 'media',
                $input['latitude'] ?? null,
                $input['longitude'] ?? null
            ]);
            
            $newId = $pdo->lastInsertId();
            
            // Return the new occurrence
            $stmt = $pdo->prepare("SELECT * FROM occurrences WHERE id = ?");
            $stmt->execute([$newId]);
            $newOccurrence = $stmt->fetch();
            
            http_response_code(201);
            echo json_encode($newOccurrence);
            break;
            
        case 'PATCH':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID é obrigatório para atualização']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['status'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Status é obrigatório']);
                break;
            }
            
            $stmt = $pdo->prepare("UPDATE occurrences SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $result = $stmt->execute([$input['status'], $id]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Incêndio não encontrado']);
                break;
            }
            
            // Return updated occurrence
            $stmt = $pdo->prepare("SELECT * FROM occurrences WHERE id = ?");
            $stmt->execute([$id]);
            $updatedOccurrence = $stmt->fetch();
            
            echo json_encode($updatedOccurrence);
            break;
            
        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'ID é obrigatório para exclusão']);
                break;
            }
            
            $stmt = $pdo->prepare("DELETE FROM occurrences WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Incêndio não encontrado']);
                break;
            }
            
            echo json_encode(['message' => 'Incêndio deletado com sucesso']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método não permitido']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor: ' . $e->getMessage()]);
}
?>
