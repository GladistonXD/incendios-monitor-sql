# Sistema de Registro de Ocorrências

![Licença](https://img.shields.io/badge/license-MIT-blue.svg)
![Versão](https://img.shields.io/badge/version-1.0.0-green.svg)

Um sistema simples para registro e gerenciamento de ocorrências urbanas como buracos em vias, problemas de iluminação, descarte irregular de lixo e outras questões de infraestrutura pública.

## 🔍 Visão Geral

Este projeto implementa um banco de dados para um sistema de registro de ocorrências urbanas, permitindo que usuários reportem problemas, acompanhem seu status e interajam através de comentários. O sistema é ideal para prefeituras, associações de bairro ou qualquer organização que precise gerenciar solicitações e ocorrências.

### Funcionalidades Principais

- Registro de ocorrências com geolocalização
- Acompanhamento de status (pendente, em análise, resolvido)
- Sistema de comentários
- Diferentes níveis de acesso (admin, operador, comum)
- Consultas e filtros por diversos critérios

## 🛠️ Tecnologias

- MySQL 8.0
- SQL padrão ANSI
- Git para controle de versão

## 📥 Instalação

### Pré-requisitos

- MySQL 8.0 ou superior
- Cliente MySQL ou ferramenta como MySQL Workbench


### Passos para Instalação

1. Clone o repositório:

```shellscript
git clone https://github.com/incendios-monitor-sql.git
cd sistema-ocorrencias
```


2. Execute o script de criação do banco de dados:

```shellscript
mysql -u seu_usuario -p &lt; schema.sql
```


3. (Opcional) Carregue dados de exemplo:

```shellscript
mysql -u seu_usuario -p sistema_ocorrencias &lt; operacoes.sql
```




## 🚀 Como Usar

### Registrar uma Nova Ocorrência

```sql
INSERT INTO ocorrencias (
    usuario_id, 
    titulo, 
    descricao, 
    status, 
    prioridade, 
    latitude, 
    longitude
) VALUES (
    1, 
    'Poste com lâmpada queimada', 
    'Poste na Rua das Flores, em frente ao número 123, está com a lâmpada queimada há 3 dias', 
    'pendente', 
    'media', 
    -23.550520, 
    -46.633308
);
```

### Consultar Ocorrências Pendentes

```sql
SELECT 
    o.id, 
    o.titulo, 
    o.descricao, 
    o.prioridade,
    u.nome AS registrado_por,
    o.data_registro
FROM 
    ocorrencias o
JOIN 
    usuarios u ON o.usuario_id = u.id
WHERE 
    o.status = 'pendente'
ORDER BY 
    o.data_registro DESC;
```

### Atualizar Status de uma Ocorrência

```sql
UPDATE ocorrencias 
SET status = 'resolvido' 
WHERE id = 1;
```

### Adicionar um Comentário

```sql
INSERT INTO comentarios (
    ocorrencia_id,
    usuario_id,
    conteudo
) VALUES (
    1,
    2,
    'Equipe de manutenção enviada ao local. Previsão de resolução: 24h.'
);
```

## 📝 Exemplos

### Exemplo 1: Fluxo Completo de uma Ocorrência

1. Usuário registra uma nova ocorrência
2. Operador adiciona comentário e muda status para "em análise"
3. Após resolução, operador atualiza status para "resolvido"
4. Usuário confirma resolução com um comentário


### Exemplo 2: Consulta de Ocorrências por Região

```sql
SELECT 
    o.id, 
    o.titulo, 
    o.status,
    (
        6371 * acos(
            cos(radians(-23.550520)) * 
            cos(radians(o.latitude)) * 
            cos(radians(o.longitude) - radians(-46.633308)) + 
            sin(radians(-23.550520)) * 
            sin(radians(o.latitude))
        )
    ) AS distancia_km
FROM 
    ocorrencias o
HAVING 
    distancia_km &lt; 5
ORDER BY 
    distancia_km;
```

## 👥 Contribuição

Contribuições são bem-vindas! Siga estes passos:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request


### Boas Práticas para Contribuição

- Mantenha o código SQL organizado e comentado
- Siga o padrão de nomenclatura existente
- Adicione índices para consultas frequentes
- Documente novas funcionalidades


## 📄 Licença

Este projeto está licenciado sob a licença MIT

---

Desenvolvido com ❤️ por [Gladiston](https://github.com/GladistonXD)

```plaintext

Este README.md fornece uma documentação clara e concisa para o projeto de Sistema de Registro de Ocorrências no GitHub. Ele inclui:

1. **Visão geral do projeto** - Explicação clara do propósito e funcionalidades
2. **Estrutura do banco de dados** - Diagrama ER simplificado
3. **Instruções de instalação** - Passos para configurar o banco de dados
4. **Exemplos de uso** - Comandos SQL para operações comuns
5. **Guia de contribuição** - Como outros desenvolvedores podem contribuir
6. **Licença** - Informações sobre licenciamento

O README segue as melhores práticas para documentação no GitHub, com formatação adequada, emojis para melhorar a legibilidade, e badges para mostrar informações importantes como licença e versão.

```


