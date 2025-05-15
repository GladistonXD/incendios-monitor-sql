-- Inserir usuários
INSERT INTO usuarios (nome, email, perfil) VALUES
('Admin', 'admin@sistema.com', 'admin'),
('Operador', 'operador@sistema.com', 'operador'),
('Usuário', 'usuario@sistema.com', 'comum');

-- Registrar ocorrência
INSERT INTO ocorrencias (usuario_id, titulo, descricao, status, prioridade, latitude, longitude) 
VALUES (2, 'Buraco na rua', 'Buraco grande na Avenida Principal', 'pendente', 'alta', -23.550520, -46.633308);

-- Adicionar comentário
INSERT INTO comentarios (ocorrencia_id, usuario_id, conteudo)
VALUES (1, 1, 'Equipe enviada para verificação');

-- Consultar ocorrências
SELECT 
    o.id, o.titulo, o.descricao, o.status, o.prioridade,
    u.nome AS registrado_por,
    o.data_registro
FROM 
    ocorrencias o
JOIN 
    usuarios u ON o.usuario_id = u.id
ORDER BY 
    o.data_registro DESC;

-- Atualizar status de ocorrência
UPDATE ocorrencias 
SET status = 'em_analise' 
WHERE id = 1;

-- Buscar ocorrências por status
SELECT * FROM ocorrencias WHERE status = 'pendente';

-- Buscar ocorrências por texto
SELECT * FROM ocorrencias WHERE titulo LIKE '%buraco%' OR descricao LIKE '%buraco%';

-- Excluir ocorrência
DELETE FROM ocorrencias WHERE id = 1;