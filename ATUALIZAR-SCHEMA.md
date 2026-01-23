# Guia de Atualização do Schema MySQL

## ⚠️ IMPORTANTE - Leia Antes de Executar

Este guia explica como atualizar o banco de dados MySQL com os novos campos e tabelas necessários para suportar todas as funcionalidades do sistema conforme os requisitos das imagens fornecidas.

## O Que Foi Adicionado

### 1. Novos Campos na Tabela `drivers`:
- `alternative_contact` - Contacto alternativo do motorista
- `date_of_birth` - Data de nascimento
- `driver_license_number` - Número da carta de condução
- `driver_license_expiry` - Data de validade da carta
- `position` - Cargo/posição do motorista
- `notes` - Observações sobre o motorista

### 2. Novos Tipos de Documentos (tabela `documents`):
- `livrete_cabeca` - Livrete do camião cabeça
- `livrete_trela` - Livrete da trela
- `caderneta` - Caderneta
- `seguro_trela` - Seguro da trela
- `inspencao_trela` - Inspeção da trela
- `livre_transito_cfm` - Livre Trânsito CFM
- `mozambique_permit` - Mozambique Permite
- `radio_difusao` - Rádio Difusão
- `manifesto_municipal` - Manifesto Municipal
- `comesa` - Certificado COMESA
- Campo `notes` adicionado para observações

### 3. Nova Tabela `vehicle_condition_checks`:
Sistema completo para rastrear a condição física dos itens do camião:
- Vidro parabrisa (Bom/Mau)
- Espelhos laterais esquerdo e direito
- Barachoque
- Capô
- Farois cabeça e trela
- Pintura
- Pneus
- Quarda lamas
- Subsalente (Pneu sobressalente)
- Associação com veículo, motorista e usuário que registrou

## Como Atualizar o Banco de Dados

### Opção 1: Banco de Dados Novo (Recomendado para Desenvolvimento)

Se você está começando um novo projeto ou pode recriar o banco:

```bash
# No MySQL (via XAMPP phpMyAdmin ou terminal)
mysql -u root -p

# Execute o schema completo
source /caminho/para/server/database/schema.sql
```

### Opção 2: Atualizar Banco de Dados Existente (Produção)

⚠️ **ATENÇÃO**: Faça backup do banco antes de executar!

```bash
# Backup do banco
mysqldump -u root -p fleetdocs > backup_fleetdocs_$(date +%Y%m%d).sql

# Execute o script de atualização
mysql -u root -p fleetdocs < server/database/update-schema.sql
```

Ou via phpMyAdmin:
1. Acesse phpMyAdmin
2. Selecione o banco `fleetdocs`
3. Vá em "SQL"
4. Copie e cole o conteúdo de `server/database/update-schema.sql`
5. Clique em "Executar"

## Novas Rotas API Disponíveis

### Vehicle Condition Checks
- `GET /api/vehicle-condition/vehicle/:vehicleId` - Lista todas verificações de um veículo
- `GET /api/vehicle-condition/vehicle/:vehicleId/latest` - Última verificação de um veículo
- `POST /api/vehicle-condition` - Criar nova verificação
- `PUT /api/vehicle-condition/:id` - Atualizar verificação
- `DELETE /api/vehicle-condition/:id` - Deletar verificação

## Atualizações no Frontend

### Formulário de Motoristas (DriverForm)
Agora inclui todos os novos campos:
- Contacto alternativo
- Data de nascimento
- Número da carta de condução
- Validade da carta
- Cargo
- Observações

### API Client (src/lib/api.ts)
Nova API adicionada:
```typescript
import { vehicleConditionApi } from '@/lib/api';

// Usar nas suas componentes
const checks = await vehicleConditionApi.getByVehicle(vehicleId);
const latest = await vehicleConditionApi.getLatest(vehicleId);
```

## Verificação Pós-Atualização

Execute estas queries para confirmar que tudo está correto:

```sql
-- Verificar novos campos em drivers
DESCRIBE drivers;

-- Verificar tipos de documentos
SHOW COLUMNS FROM documents LIKE 'file_type';

-- Verificar tabela de verificação de condição
DESCRIBE vehicle_condition_checks;

-- Verificar se há dados (deve estar vazio inicialmente)
SELECT COUNT(*) FROM vehicle_condition_checks;
```

## Próximos Passos

Após atualizar o schema:

1. ✅ Reinicie o servidor backend: `node server/index.js`
2. ✅ Teste o formulário de motoristas com os novos campos
3. ✅ Crie componentes de UI para verificação de condição dos veículos
4. ✅ Adicione os novos tipos de documentos nos dropdowns
5. ✅ Teste a criação de documentos com os novos tipos

## Suporte

Se encontrar erros:
1. Verifique os logs do servidor backend
2. Confirme que o MySQL está rodando
3. Verifique as permissões do usuário do banco
4. Confirme que todas as foreign keys estão corretas

## Checklist Completo

- [ ] Backup do banco realizado
- [ ] Script de atualização executado sem erros
- [ ] Servidor backend reiniciado
- [ ] Novos campos aparecem no formulário de motoristas
- [ ] API de vehicle condition está respondendo
- [ ] Testes básicos de criação/edição funcionando
