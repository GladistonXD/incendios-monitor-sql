-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS sistema_ocorrencias;
USE sistema_ocorrencias;

-- Tabela de Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    perfil ENUM('admin', 'operador', 'comum') NOT NULL DEFAULT 'comum'
);

-- Tabela de Ocorrências
CREATE TABLE ocorrencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    status ENUM('pendente', 'em_analise', 'resolvido') NOT NULL DEFAULT 'pendente',
    prioridade ENUM('baixa', 'media', 'alta') NOT NULL DEFAULT 'media',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Comentários
CREATE TABLE comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ocorrencia_id INT NOT NULL,
    usuario_id INT NOT NULL,
    conteudo TEXT NOT NULL,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencias(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);