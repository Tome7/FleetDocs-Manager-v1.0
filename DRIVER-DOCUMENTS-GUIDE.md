# Guia de Documentos dos Motoristas - FleetDocs

## Visão Geral
Este sistema gerencia todos os documentos dos motoristas conforme as exigências de Moçambique, incluindo alertas automáticos de validade e rastreamento completo.

## Tipos de Documentos Suportados

### 1. Carta de Condução / CNH
- **Descrição**: Licença para conduzir veículos
- **Expiração**: Sim (renovação periódica)
- **Campos**: Número, data de emissão, data de validade, categorias

### 2. Exame Médico
- **Descrição**: Atestado médico de aptidão para condução
- **Expiração**: Sim (anual ou conforme idade)
- **Campos**: Data do exame, clínica, próxima data requerida

### 3. Certificado de Treinamento
- **Descrição**: Comprovante de formação e capacitação
- **Expiração**: Opcional (depende do tipo)
- **Campos**: Tipo de treinamento, instituição, data

### 4. Certificado de Direção Defensiva
- **Descrição**: Curso de direção defensiva
- **Expiração**: Sim (renovação periódica)
- **Campos**: Data de conclusão, validade

### 5. Certificado de Cargas Perigosas
- **Descrição**: Habilitação para transporte de materiais perigosos
- **Expiração**: Sim (renovação obrigatória)
- **Campos**: Categorias autorizadas, validade

### 6. Seguro Pessoal
- **Descrição**: Seguro de acidentes pessoais do motorista
- **Expiração**: Sim (anual)
- **Campos**: Seguradora, apólice, coberturas

### 7. Outros Documentos
- **Descrição**: Documentos específicos da empresa
- **Expiração**: Opcional

## Funcionalidades Principais

### ✅ Gestão de Documentos sem Expiração
Alguns documentos (como certificados de conclusão de cursos não renováveis) não têm data de validade. O sistema suporta:
- Campo `expiry_date` como NULL
- Status `permanent` para documentos sem validade
- Não gera alertas para estes documentos

### ✅ Alertas Automáticos
Sistema de alertas em camadas:
- **30 dias** antes da expiração
- **15 dias** antes da expiração
- **7 dias** antes da expiração
- **3 dias** antes da expiração
- **Expirado** após a data de validade

### ✅ Upload de Ficheiros
- Suporta PDF, JPG, PNG
- Armazenamento seguro no servidor
- Download protegido por autenticação

### ✅ Rastreamento Completo
- Data de emissão
- Data de validade
- Local de armazenamento físico
- Observações e notas
- Histórico de alterações

## Estrutura da Base de Dados

```sql
CREATE TABLE driver_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doc_code VARCHAR(100) UNIQUE NOT NULL,
  doc_name VARCHAR(200) NOT NULL,
  doc_type ENUM(...) NOT NULL,
  driver_id INT NOT NULL,
  issue_date DATE,
  expiry_date DATE NULL,  -- NULL = sem expiração
  current_status ENUM('valid', 'expiring_30_days', 'expired', 'permanent'),
  storage_location VARCHAR(100),
  file_path VARCHAR(500),
  file_mime_type VARCHAR(100),
  file_size INT,
  notes TEXT,
  FOREIGN KEY (driver_id) REFERENCES users(id)
);
```

## API Endpoints

### Listar Documentos
```
GET /api/driver-documents
GET /api/driver-documents/driver/:driverId
```

### Criar Documento
```
POST /api/driver-documents
Content-Type: application/json

{
  "doc_code": "DOC-MOT-123",
  "doc_name": "Carta de Condução",
  "doc_type": "carta_conducao",
  "driver_id": 1,
  "issue_date": "2023-01-15",
  "expiry_date": "2028-01-15",  // ou null para sem expiração
  "storage_location": "Arquivo Central",
  "notes": "Categoria B e C"
}
```

### Upload com Ficheiro
```
POST /api/driver-documents/upload
Content-Type: multipart/form-data

FormData:
  - file: [ficheiro]
  - doc_code: "DOC-MOT-123"
  - doc_name: "Carta de Condução"
  - ... outros campos
```

### Atualizar Documento
```
PUT /api/driver-documents/:id
Content-Type: application/json

{
  "doc_name": "CNH Atualizada",
  "expiry_date": "2029-01-15",
  ...
}
```

### Download
```
GET /api/driver-documents/download/:id
```

### Atualizar Status (Cron Job)
```
POST /api/driver-documents/update-statuses
```

## Integração com Documentos de Veículos

### Sistema Unificado
- Documentos de **veículos**: registration, insurance, inspection, **livrete**, etc.
- Documentos de **motoristas**: carta_conducao, exame_medico, certificados, etc.
- Alertas centralizados para ambos os tipos

### Relatórios Consolidados
Os relatórios podem incluir:
- Status de documentos por motorista
- Comparação veículos vs motoristas
- Alertas combinados
- Documentos próximos do vencimento (ambos os tipos)

## Configuração MySQL

### Executar Schema
```bash
mysql -u root -p < server/database/schema.sql
```

### Verificar Tabelas
```sql
USE fleetdocs;
SHOW TABLES;
DESC driver_documents;
```

### Dados de Teste
```sql
-- Inserir documento de motorista
INSERT INTO driver_documents 
(doc_code, doc_name, doc_type, driver_id, issue_date, expiry_date, current_status)
VALUES 
('CNH-001', 'Carta de Condução - João Silva', 'carta_conducao', 1, '2023-01-15', '2028-01-15', 'valid');

-- Inserir documento permanente (sem expiração)
INSERT INTO driver_documents 
(doc_code, doc_name, doc_type, driver_id, issue_date, expiry_date, current_status)
VALUES 
('CERT-001', 'Certificado Curso Básico', 'cert_treinamento', 1, '2022-06-10', NULL, 'permanent');
```

## Validação e Segurança

### Permissões
- **Admin/Fleet Manager**: Criar, editar, deletar documentos
- **Todos autenticados**: Visualizar documentos (com restrições)
- Download protegido por autenticação

### Validação de Status
O sistema calcula automaticamente o status baseado na data de validade:
- `permanent`: expiry_date é NULL
- `valid`: mais de 30 dias até expirar
- `expiring_30_days`: entre 0 e 30 dias
- `expired`: data passou

## Boas Práticas

1. **Sempre configure alertas** para documentos com expiração
2. **Use códigos únicos** para rastreamento
3. **Mantenha observações** sobre renovações e pendências
4. **Faça backup** dos ficheiros periodicamente
5. **Atualize status** regularmente (endpoint update-statuses)

## Próximos Passos Recomendados

1. Configurar notificações por email/SMS
2. Dashboard de compliance (documentos em dia vs vencidos)
3. Relatórios de renovação por período
4. Integração com sistemas de RH
5. App mobile para motoristas consultarem seus documentos
