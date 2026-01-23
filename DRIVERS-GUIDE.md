# Sistema de Motoristas - FleetDocs

## Visão Geral

O sistema de motoristas do FleetDocs foi desenvolvido para separar completamente os **motoristas** (que conduzem veículos) dos **usuários do sistema** (que operam a aplicação). Esta separação é fundamental para uma gestão adequada da frota.

## Características Principais

### 1. Motoristas como Entidade Independente
- Motoristas **NÃO** são usuários do sistema
- Motoristas **NÃO** fazem login na aplicação
- Motoristas são cadastrados e geridos pelos gestores de frota
- Cada motorista possui:
  - Número de trabalhador (staff_no) - único
  - Nome completo
  - Contacto/telefone (obrigatório)
  - Departamento (opcional)
  - Frota (opcional)
  - Estado (activo, em licença, inactivo)

### 2. Atribuição de Veículos
- Um veículo pode ser atribuído a um motorista
- Um motorista pode ter apenas um veículo atribuído de cada vez
- É possível transferir veículos entre motoristas
- Veículos podem estar sem motorista atribuído
- O sistema previne conflitos (veículo já atribuído a outro motorista)

### 3. Documentos dos Motoristas
- Cada motorista possui documentos próprios (CNH, exame médico, certificados)
- Os documentos são rastreados independentemente
- Alertas automáticos de expiração
- Documentos moçambicanos suportados

### 4. Movimentação de Documentos
- Motoristas podem retirar e devolver documentos de veículos
- Sistema regista quem retirou o documento e quando
- Histórico completo de movimentações

## Estrutura da Base de Dados

### Tabela `drivers`
```sql
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_no VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  fleet VARCHAR(100),
  status ENUM('active', 'on_leave', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  data_version INT DEFAULT 0
);
```

### Relacionamentos
- `vehicles.assigned_driver_id` → `drivers.id` (veículo atribuído ao motorista)
- `driver_documents.driver_id` → `drivers.id` (documentos do motorista)
- `flow_records.driver_id` → `drivers.id` (movimentações feitas pelo motorista)

## API Endpoints

### Motoristas

#### Listar todos os motoristas
```
GET /api/drivers
```
Retorna todos os motoristas com:
- Dados básicos
- Total de documentos
- Documentos expirados/a expirar
- Veículo atribuído (se houver)

#### Obter motorista específico
```
GET /api/drivers/:id
```

#### Criar motorista
```
POST /api/drivers
Body: {
  "staff_no": "MOT001",
  "name": "João Silva",
  "contact": "+258 84 123 4567",
  "department": "Transporte",
  "fleet": "Frota A",
  "status": "active"
}
```

#### Atualizar motorista
```
PUT /api/drivers/:id
Body: {
  "name": "João Silva",
  "contact": "+258 84 123 4567",
  "department": "Transporte",
  "fleet": "Frota A",
  "status": "active"
}
```

#### Eliminar motorista
```
DELETE /api/drivers/:id
```
Nota: Não permite eliminar motorista com veículo atribuído

### Atribuição de Veículos

#### Atribuir veículo a motorista
```
POST /api/drivers/:id/assign-vehicle
Body: {
  "vehicle_id": 5
}
```

#### Desatribuir veículo de motorista
```
POST /api/drivers/:id/unassign-vehicle
```

#### Transferir veículo entre motoristas
```
POST /api/drivers/transfer-vehicle
Body: {
  "vehicle_id": 5,
  "from_driver_id": 1,
  "to_driver_id": 2
}
```

## Fluxo de Trabalho Típico

### 1. Cadastro de Motorista
1. Gestor cria novo motorista no sistema
2. Preenche dados obrigatórios (número de trabalhador, nome, contacto)
3. Define departamento e frota (opcional)
4. Sistema cria motorista com estado "activo"

### 2. Atribuição de Veículo
1. Gestor seleciona motorista
2. Atribui veículo disponível ao motorista
3. Sistema valida se veículo já está atribuído
4. Sistema regista atribuição

### 3. Transferência de Veículo
1. Gestor inicia transferência
2. Seleciona veículo, motorista origem e motorista destino
3. Sistema valida permissões
4. Sistema transfere veículo

### 4. Gestão de Documentos
1. Motorista retira documento de veículo
2. Sistema regista movimentação (withdrawal)
3. Motorista devolve documento
4. Sistema regista devolução (return)

## Validações e Regras

### Motoristas
- `staff_no` deve ser único
- `contact` é obrigatório (para comunicação)
- Não pode eliminar motorista com veículo atribuído
- Pode ter motorista sem veículo (disponível)

### Veículos
- Veículo só pode ter um motorista
- Pode transferir veículo entre motoristas
- Pode ter veículo sem motorista (pool de veículos)

### Documentos
- Motoristas podem ter documentos independentes dos veículos
- Documentos de motoristas seguem mesma lógica de expiração
- Alertas automáticos para CNH vencida, exame médico, etc.

## Diferença: Motoristas vs Usuários

| Motoristas | Usuários |
|-----------|----------|
| Conduzem veículos | Operam o sistema |
| NÃO fazem login | Fazem login |
| Geridos por gestores | Possuem permissões |
| Têm documentos próprios | Têm roles (admin, gestor, operador) |
| Podem ser atribuídos a veículos | Gerem a frota |
| Tabela `drivers` | Tabela `users` |

## Próximos Passos

### Configuração
1. Execute o script SQL atualizado: `server/database/schema.sql`
2. Certifique-se que a tabela `drivers` foi criada
3. Verifique as foreign keys em `vehicles`, `driver_documents` e `flow_records`

### Interface
1. Criar página de gestão de motoristas
2. Implementar formulário de cadastro
3. Adicionar funcionalidade de atribuição de veículos
4. Mostrar veículo atribuído no card do motorista
5. Permitir transferência de veículos

### Relatórios
1. Relatório de motoristas por frota
2. Relatório de veículos atribuídos/disponíveis
3. Histórico de transferências de veículos
4. Documentos de motoristas expirados

## Suporte

Para questões ou problemas, consulte:
- `server/routes/drivers.js` - Rotas da API
- `src/lib/api.ts` - Cliente da API
- `src/components/DriverForm.tsx` - Formulário de motorista
- `src/components/DriverCard.tsx` - Card de motorista
