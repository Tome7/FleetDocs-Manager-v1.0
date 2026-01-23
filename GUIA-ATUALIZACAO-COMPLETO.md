# 🚀 Guia de Atualização Completo - FleetDocs

## ✅ Correções Mais Recentes (Dezembro 2024)

### 🔧 Download de Documentos - CORRIGIDO
- **Problema**: Downloads retornavam ficheiros .txt em vez do original
- **Correção**: 
  - Headers `Content-Type` e `Content-Disposition` corretos no servidor
  - Blob criado com MIME type correto no frontend
  - Suporte a caminhos relativos e absolutos

### 🔧 Pré-visualização de Documentos - CORRIGIDO
- **Problema**: Preview não funcionava corretamente
- **Correção**: 
  - Blob criado com MIME type correto
  - Suporte para PDF, imagens e outros formatos
  - Fallback para download quando preview não disponível

### 🔧 Dashboard - Contagens Corrigidas
- **Problema**: Contagens de documentos incorretas
- **Correção**: Busca todos os documentos (veículos e motoristas) da API

### 🔧 Sistema de Alertas - UI Melhorada
- Separação por urgência (Urgente vs Atenção)
- Identificação visual de origem (Veículo vs Motorista)
- ScrollArea para melhor navegação

---

## ✅ O Que Foi Implementado

## 📋 Passo a Passo para Atualizar

### **PASSO 1: Backup da Base de Dados (OBRIGATÓRIO)**

```bash
# Abrir terminal/command prompt
cd C:\xampp\mysql\bin

# Fazer backup
mysqldump -u root -p fleetdocs > backup_fleetdocs_antes_atualizacao.sql
```

### **PASSO 2: Executar Script de Atualização**

#### Opção A: Via phpMyAdmin (Recomendado para Windows)

1. Abrir XAMPP Control Panel
2. Iniciar Apache e MySQL
3. Abrir navegador: `http://localhost/phpmyadmin`
4. Selecionar base de dados `fleetdocs`
5. Clicar na aba "SQL"
6. Abrir o ficheiro `server/database/complete-schema-update.sql` num editor de texto
7. Copiar TODO o conteúdo
8. Colar na área de texto do phpMyAdmin
9. Clicar em "Executar" (ou "Go")
10. Verificar se aparece "Script executado com sucesso!"

#### Opção B: Via Linha de Comando

```bash
cd C:\xampp\mysql\bin
mysql -u root -p fleetdocs < C:\caminho\completo\para\server\database\complete-schema-update.sql
```

### **PASSO 3: Verificar a Atualização**

Execute estas queries no phpMyAdmin (aba SQL) para confirmar:

```sql
-- Ver novos campos em drivers
DESCRIBE drivers;

-- Ver tipos de documentos de veículos
SHOW COLUMNS FROM documents LIKE 'file_type';

-- Ver se tabela driver_documents existe
SHOW TABLES LIKE 'driver_documents';

-- Ver itens do checklist
SELECT COUNT(*) as total_itens FROM vehicle_condition_items;

-- Ver totais
SELECT 
  (SELECT COUNT(*) FROM drivers) as total_motoristas,
  (SELECT COUNT(*) FROM vehicles) as total_veiculos,
  (SELECT COUNT(*) FROM documents) as total_docs_veiculos,
  (SELECT COUNT(*) FROM driver_documents) as total_docs_motoristas;
```

**Resultados Esperados:**
- `drivers` deve ter 6 novos campos
- `documents` deve ter novos tipos de documentos
- `driver_documents` deve existir
- `vehicle_condition_items` deve ter aproximadamente 20 itens
- Os totais devem aparecer sem erro

### **PASSO 4: Reiniciar Servidor Backend**

```bash
# No terminal na pasta server
cd server
node index.js
```

**Deve aparecer:**
```
MySQL connected successfully
Server running on port 3001
```

### **PASSO 5: Iniciar Frontend**

```bash
# No terminal na pasta raiz do projeto
npm run dev
```

### **PASSO 6: Testar Funcionalidades**

#### ✅ Teste 1: Dashboard
- Abrir `http://localhost:5173`
- Fazer login
- Verificar se o dashboard mostra:
  - Total de Veículos (correto)
  - Documentos Válidos (correto)
  - Perto de Expirar (correto)
  - Expirados (correto)

#### ✅ Teste 2: Adicionar Motorista
- Ir para tab "Motoristas"
- Clicar "Adicionar Motorista"
- Preencher formulário (deve ter scroll se necessário)
- Verificar todos os campos novos estão presentes
- Salvar

#### ✅ Teste 3: Documentos de Motorista
- No cartão do motorista, clicar no botão "Documentos"
- Deve abrir diálogo com lista de documentos
- Clicar "Adicionar Documento"
- Preencher formulário
- **OBRIGATÓRIO**: Fazer upload de ficheiro (PDF, JPG ou PNG)
- Marcar se documento tem validade ou não
- Salvar
- Verificar se documento aparece na lista
- Testar preview e download

#### ✅ Teste 4: Alertas
- Se houver documentos a expirar (veículos ou motoristas)
- Deve aparecer notificação no ícone de sino
- Clicar no sino para ver alertas
- Deve mostrar documentos de veículos E motoristas

#### ✅ Teste 5: Exportar Excel
- Clicar no ícone de relatórios
- Escolher qualquer tipo de relatório
- Exportar para Excel
- Verificar se ficheiro baixa corretamente
- Abrir ficheiro e verificar dados

---

## 🔧 Resolução de Problemas

### Erro: "Table doesn't exist"
**Solução:** Executar primeiro o schema completo:
```bash
mysql -u root -p fleetdocs < server/database/schema.sql
# Depois executar o update
mysql -u root -p fleetdocs < server/database/complete-schema-update.sql
```

### Erro: "Duplicate column name"
**Solução:** Os campos já existem. Isto é normal se já executou o script antes.

### Erro: "Access denied"
**Solução:** Verificar credenciais MySQL no ficheiro `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=fleetdocs
```

### Backend não inicia
**Solução:**
```bash
cd server
npm install
node index.js
```

### Frontend não abre
**Solução:**
```bash
npm install
npm run dev
```

### Upload de documentos não funciona
**Solução:** Verificar se pasta `uploads` existe no servidor:
```bash
mkdir server/uploads
mkdir server/uploads/vehicles
mkdir server/uploads/drivers
```

---

## 📊 Estrutura Atualizada da Base de Dados

### Tabela: `drivers` (Motoristas)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| staff_no | VARCHAR(50) | Número de trabalhador |
| name | VARCHAR(255) | Nome completo |
| contact | VARCHAR(20) | Contacto principal |
| **alternative_contact** | **VARCHAR(20)** | **Contacto alternativo** ⭐ NOVO |
| **date_of_birth** | **DATE** | **Data de nascimento** ⭐ NOVO |
| **driver_license_number** | **VARCHAR(50)** | **Nº carta condução** ⭐ NOVO |
| **driver_license_expiry** | **DATE** | **Validade carta** ⭐ NOVO |
| **position** | **VARCHAR(100)** | **Cargo** ⭐ NOVO |
| **notes** | **TEXT** | **Observações** ⭐ NOVO |
| department | VARCHAR(100) | Departamento |
| fleet | VARCHAR(100) | Frota |
| status | ENUM | Estado (active, on_leave, inactive) |

### Tabela: `driver_documents` (Documentos dos Motoristas) ⭐ NOVA
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único |
| driver_id | INT | ID do motorista |
| doc_code | VARCHAR(50) | Código do documento |
| doc_name | VARCHAR(255) | Nome do documento |
| doc_type | ENUM | Tipo (carta_conducao, cnh, exame_medico, etc.) |
| issue_date | DATE | Data de emissão |
| expiry_date | DATE | Data de validade (opcional) |
| **has_expiry** | **BOOLEAN** | **Se tem validade** ⭐ NOVO |
| file_path | VARCHAR(500) | Caminho do ficheiro |
| storage_location | VARCHAR(255) | Local físico |
| **notes** | **TEXT** | **Observações** ⭐ NOVO |
| current_status | ENUM | Estado (valid, expiring_30_days, expired) |

### Tipos de Documentos de Motoristas
- `carta_conducao` - Carta de Condução
- `cnh` - CNH (Carteira Nacional)
- `exame_medico` - Exame Médico
- `cert_treinamento` - Certificado de Treinamento
- `cert_defesa_defensiva` - Certificado Direção Defensiva
- `cert_cargas_perigosas` - Certificado Cargas Perigosas
- `seguro_pessoal` - Seguro Pessoal
- `other` - Outro

### Tabela: `vehicle_condition_items` (Itens do Checklist) ⭐ NOVA
Items dinâmicos configuráveis para verificação de condição dos veículos:
- Vidro parabrisa, espelhos, farois
- Pneus, subsalente, bateria
- Extintor, triângulo, macaco
- E mais...

---

## 🎯 Funcionalidades Prontas

### ✅ Sistema de Documentos de Motoristas
- Adicionar documentos com upload obrigatório
- Documentos com ou sem validade
- Preview antes de descarregar
- Editar e eliminar documentos
- Estados automáticos (válido, a expirar, expirado)

### ✅ Dashboard Atualizado
- Estatísticas precisas baseadas em dados reais
- Conta documentos de veículos
- Mostra veículos com documentos válidos/expirados

### ✅ Sistema de Alertas Completo
- Alertas para documentos de veículos
- Alertas para documentos de motoristas
- Notificações 30, 15, 7, 3 dias antes
- Notificações de documentos expirados

### ✅ Exportação Excel/CSV
- Relatório completo da frota
- Relatório de documentos
- Relatório de movimentações
- Perfil completo do motorista

---

## 📝 Checklist Final

- [ ] Backup da base de dados feito
- [ ] Script SQL executado sem erros
- [ ] Verificações SQL todas corretas
- [ ] Backend iniciado sem erros
- [ ] Frontend iniciado sem erros
- [ ] Login funciona
- [ ] Dashboard mostra dados corretos
- [ ] Consegue adicionar motorista com novos campos
- [ ] Consegue adicionar documentos de motorista
- [ ] Upload de ficheiros funciona
- [ ] Preview de documentos funciona
- [ ] Alertas aparecem corretamente
- [ ] Exportação Excel funciona

---

## 💡 Próximos Passos Sugeridos

Após confirmar que tudo funciona:

1. **Cadastrar Veículos**: Registar todos os veículos da frota
2. **Cadastrar Motoristas**: Registar todos os motoristas
3. **Upload de Documentos**: Digitalizar e fazer upload de todos os documentos
4. **Configurar Alertas**: Verificar datas de validade estão corretas
5. **Treinar Usuários**: Ensinar equipa a usar o sistema

---

## 🆘 Suporte

Se encontrar problemas:
1. Verificar logs do servidor backend no terminal
2. Verificar console do navegador (F12 → Console)
3. Verificar se MySQL está a correr no XAMPP
4. Verificar permissões da pasta `uploads`
5. Verificar ficheiro `.env` com credenciais corretas

**Logs Importantes:**
- Backend: Aparece no terminal onde rodou `node index.js`
- Frontend: F12 → Console no navegador
- MySQL: XAMPP Control Panel → Logs

---

## ✨ Conclusão

Após seguir este guia:
- ✅ Base de dados atualizada com todas as novas funcionalidades
- ✅ Sistema de documentos de motoristas completo
- ✅ Dashboard com dados reais
- ✅ Alertas para todos os tipos de documentos
- ✅ Exportação Excel funcionando
- ✅ Interface otimizada e responsiva

**Sistema pronto para uso em produção!** 🚀
