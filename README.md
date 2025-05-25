# 🚀 Como Instalar no XAMPP

## 📋 Pré-requisitos
- XAMPP instalado ([Download aqui](https://www.apachefriends.org/))

## 🔧 Passo a Passo

### 1. **Baixar e Preparar**
```bash
# Criar pasta no htdocs do XAMPP
# Exemplo: C:\xampp\htdocs\occurrence-system\
```

### 2. **Copiar Arquivos**
Copie todos os arquivos para a pasta criada:
```
C:\xampp\htdocs\occurrence-system\
├── index.html
├── app.js
├── config/
│   └── database.php
├── api/
│   ├── occurrences.php
│   └── stats.php
└── INSTALACAO_XAMPP.md
```

### 3. **Iniciar XAMPP**
1. Abra o **XAMPP Control Panel**
2. Inicie o **Apache** (clique em "Start")
3. Inicie o **MySQL** (clique em "Start")

### 4. **Criar Banco de Dados (Opcional)**
O banco é criado automaticamente, mas você pode criar manualmente:

1. Acesse: http://localhost/phpmyadmin
2. Clique em "Novo" 
3. Nome do banco: `occurrence_system`
4. Clique em "Criar"

### 5. **Acessar o Sistema**
Abra o navegador e acesse:
```
http://localhost/occurrence-system/
```

## ✅ **Verificar se está funcionando**

1. **Teste de conexão**: Clique no botão "Testar DB" no sistema
2. **Deve aparecer**: "✅ Conexão com banco OK!"
3. **Se der erro**: Verifique se Apache e MySQL estão rodando

## 🔧 **Configurações do Banco**

Se precisar alterar as configurações, edite o arquivo `config/database.php`:

```php
$host = 'localhost';        // Servidor MySQL
$dbname = 'occurrence_system'; // Nome do banco
$username = 'root';         // Usuário MySQL
$password = '';             // Senha MySQL (vazio no XAMPP)
```

## 📱 **Funcionalidades**

- ✅ **Captura de fotos** via câmera
- ✅ **Upload de imagens**
- ✅ **Banco MySQL** permanente
- ✅ **Filtros e busca**
- ✅ **Estatísticas**
- ✅ **Exportar dados**
- ✅ **Interface responsiva**

## 🐛 **Problemas Comuns**

### **❌ "Erro de conexão com banco"**
- Verifique se MySQL está rodando no XAMPP
- Confirme se o banco `occurrence_system` existe
- Teste: http://localhost/phpmyadmin

### **❌ "Página não carrega"**
- Verifique se Apache está rodando no XAMPP
- Confirme se os arquivos estão em `htdocs/occurrence-system/`
- Teste: http://localhost/

### **❌ "Câmera não funciona"**
- Permita acesso à câmera no navegador
- Use HTTPS em produção (localhost funciona em HTTP)
- Alternativamente, use "Carregar Imagem"

### **❌ "Erro 500 - Internal Server Error"**
- Verifique se PHP está habilitado no XAMPP
- Confirme se os arquivos PHP têm a extensão `.php`
- Verifique logs em: `xampp/apache/logs/error.log`

## 🌐 **Acessar de outros dispositivos**

Para acessar de celular/tablet na mesma rede:

1. Descubra o IP do computador: `ipconfig` (Windows) ou `ifconfig` (Linux/Mac)
2. Acesse: `https://[SEU_IP]/occurrence-system/`
3. Exemplo: `https://192.168.1.100/occurrence-system/`

### **Para certificado SSL para executar https recomendo:**

### **1. Baixar e configurar ngrok:**

1. **Acesse:** [https://ngrok.com/](https://ngrok.com/)
2. **Faça cadastro gratuito**
3. **Baixe o ngrok** para Windows
4. **Extraia** o arquivo `ngrok.exe` para uma pasta (ex: `C:\ngrok\`)


### **2. Configurar token:**

1. **No site do ngrok**, copie seu token de autenticação
2. **Abra o Prompt de Comando** como administrador
3. **Navegue para a pasta do ngrok:**

```shellscript
cd C:\ngrok
```


**3. Configure o token:**

```shellscript
ngrok config add-authtoken SEU_TOKEN_AQUI
```


### **4. Executar ngrok:**

**No mesmo Prompt de Comando:**

```shellscript
ngrok http 80
```

## 📊 **Banco de Dados**

O sistema cria automaticamente a tabela:

```sql
CREATE TABLE occurrences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image LONGTEXT NOT NULL,
    comment TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Não resolvido',
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🎯 **Pronto para usar!**

Agora você tem um sistema completo de registro de ocorrências rodando no XAMPP com banco MySQL! 🎉
