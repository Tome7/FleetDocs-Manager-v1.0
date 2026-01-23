# Configuração do Sistema FleetDocs com MySQL/XAMPP

## Pré-requisitos

1. **XAMPP** instalado (https://www.apachefriends.org/)
2. **Node.js** (v18 ou superior) instalado
3. **Git** instalado

## Passo 1: Configurar XAMPP

1. Inicie o XAMPP Control Panel
2. Inicie os serviços:
   - **Apache** (servidor web)
   - **MySQL** (base de dados)
3. Verifique que os serviços estão rodando (indicadores verdes)

## Passo 2: Criar a Base de Dados

### Opção A: Via phpMyAdmin (Recomendado)

1. Abra o navegador e acesse: `http://localhost/phpmyadmin`
2. Clique em "SQL" no menu superior
3. Copie e cole todo o conteúdo do arquivo `server/database/schema.sql`
4. Clique em "Executar" (Go)
5. Verifique que a base de dados `fleetdocs` foi criada com sucesso

### Opção B: Via Linha de Comando

```bash
# Acesse o diretório do MySQL no XAMPP
cd C:\xampp\mysql\bin

# Execute o script
mysql -u root -p < caminho/para/server/database/schema.sql
```

## Passo 3: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` se necessário (valores padrão do XAMPP):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=fleetdocs
   JWT_SECRET=mude-isto-para-producao-seguro
   ```

## Passo 4: Instalar Dependências do Servidor

```bash
# Instalar dependências do backend
npm install express mysql2 cors dotenv jsonwebtoken
```

## Passo 5: Iniciar o Servidor Backend

```bash
# Na raiz do projeto
node server/index.js
```

Você deve ver a mensagem:
```
MySQL connected successfully
Server running on port 3001
```

## Passo 6: Iniciar o Frontend

Em outro terminal:

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:8080`

## Passo 7: Testar o Sistema

### Login Padrão

Use as credenciais do administrador padrão:
- **Email**: admin@fleetdocs.com
- **Password**: admin123

⚠️ **IMPORTANTE**: Altere esta senha após o primeiro login!

## Estrutura da Base de Dados

O sistema cria as seguintes tabelas:

- `users` - Utilizadores do sistema (motoristas, despachantes, gestores)
- `vehicles` - Veículos da frota
- `documents` - Documentos dos veículos
- `flow_records` - Registos de retirada/devolução
- `sync_queue` - Fila de sincronização offline
- `alerts` - Alertas de vencimento

## Verificar Conexão

Teste a API acessando no navegador:
```
http://localhost:3001/api/health
```

Deve retornar:
```json
{"status":"ok","message":"Server is running"}
```

## Troubleshooting

### Erro: "MySQL connection error"

1. Verifique se o MySQL está rodando no XAMPP
2. Confirme as credenciais no arquivo `.env`
3. Verifique se a base de dados `fleetdocs` existe

### Erro: "Port 3001 already in use"

Altere a porta no arquivo `.env`:
```env
PORT=3002
```

### Erro: "Cannot find module"

Execute novamente:
```bash
npm install
```

## Backup da Base de Dados

### Criar Backup

Via phpMyAdmin:
1. Acesse `http://localhost/phpmyadmin`
2. Selecione a base `fleetdocs`
3. Clique em "Exportar"
4. Escolha o formato "SQL"
5. Clique em "Executar"

Via Linha de Comando:
```bash
cd C:\xampp\mysql\bin
mysqldump -u root fleetdocs > backup_fleetdocs.sql
```

### Restaurar Backup

Via phpMyAdmin:
1. Selecione a base `fleetdocs`
2. Clique em "Importar"
3. Escolha o arquivo de backup
4. Clique em "Executar"

## Próximos Passos

1. [ ] Alterar senha do administrador padrão
2. [ ] Configurar JWT_SECRET seguro no `.env`
3. [ ] Adicionar veículos e documentos ao sistema
4. [ ] Configurar alertas e notificações
5. [ ] Testar funcionalidade offline

## Suporte

Para mais informações, consulte:
- Documentação do XAMPP: https://www.apachefriends.org/documentation.html
- Documentação do MySQL: https://dev.mysql.com/doc/
