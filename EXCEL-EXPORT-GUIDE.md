# 📊 Guia de Exportação Excel - FleetDocs

## Visão Geral

O sistema FleetDocs oferece exportação profissional de dados para Excel (.xlsx) com estrutura robusta, padronizada e compatível com os rigorosos padrões operacionais de empresas de logística.

## 🎯 Características Principais

### 1. **Múltiplas Abas (Sheets)**
Cada relatório é organizado em múltiplas abas para facilitar a navegação:
- **Resumo**: Estatísticas gerais e indicadores-chave
- **Dados Principais**: Informação detalhada
- **Categorias Específicas**: Dados segmentados (ex: expirados, a expirar)

### 2. **Formatação Profissional**
- ✅ Cabeçalhos formatados e destacados
- ✅ Filtros automáticos em todas as colunas
- ✅ Largura de colunas otimizada para cada tipo de dado
- ✅ Formatação de datas no padrão português (dd/MM/yyyy)
- ✅ Formatação numérica apropriada

### 3. **Estrutura de Dados Padronizada**
Cada tipo de relatório segue uma estrutura consistente:

#### **Relatório de Veículos**
- **Aba Resumo**: Total de veículos, ativos, em manutenção, alertas
- **Aba Veículos**: Lista completa com todas as informações
- **Colunas**: Matrícula, Modelo, Departamento, Frota, Estado, Contagem de Documentos

#### **Relatório de Documentos**
- **Aba Resumo**: Total, válidos, a expirar, expirados
- **Aba Todos os Documentos**: Lista completa
- **Aba Documentos Expirados**: Apenas os vencidos
- **Aba Documentos a Expirar**: Alertas de 30 dias
- **Colunas**: Código, Nome, Tipo, Veículo, Validade, Estado, Localização

#### **Relatório de Movimentações (Flow Records)**
- **Aba Resumo**: Total de operações, retiradas, devoluções
- **Aba Movimentações**: Histórico completo
- **Colunas**: Motorista, Departamento, Documento, Veículo, Operação, Datas, Observações

#### **Relatório de Perfil do Motorista**
- **Aba Perfil**: Dados pessoais e estatísticas
- **Aba Histórico**: Todas as movimentações do motorista
- **Informações**: Nome, Nº Funcional, Departamento, Total de Operações

## 📋 Como Usar

### 1. Aceder aos Relatórios
- Clique no ícone **📄** no cabeçalho do sistema
- Selecione a aba do relatório desejado

### 2. Exportar para Excel
- Clique no botão **"Exportar Excel"** (ícone de folha de cálculo)
- O ficheiro será descarregado automaticamente
- Nome do ficheiro inclui timestamp: `Relatorio_Tipo_YYYY-MM-DD_HHMMSS.xlsx`

### 3. Exportar para CSV (Alternativa)
- Clique no botão **"CSV"** para exportação simples
- Útil para importação em outros sistemas

## 🔍 Tipos de Relatórios Disponíveis

### **1. Frota Completa**
```
Relatorio_Veiculos_2025-01-15_143022.xlsx
```
- Resumo da frota
- Lista de todos os veículos
- Estado de documentação de cada veículo

### **2. Documentos**
```
Relatorio_Documentos_2025-01-15_143022.xlsx
```
- Resumo geral
- Todos os documentos
- Documentos expirados (se houver)
- Documentos a expirar (se houver)

### **3. Movimentações**
```
Relatorio_Movimentacoes_2025-01-15_143022.xlsx
```
- Resumo de operações
- Histórico completo de retiradas e devoluções
- Informação do motorista e documento

### **4. Perfil de Motorista**
```
Perfil_Motorista_DRV001_2025-01-15_143022.xlsx
```
- Dados pessoais do motorista
- Histórico de todas as suas operações

## 📊 Estrutura de Dados

### Campos Incluídos

#### **Veículos**
| Campo | Descrição | Formato |
|-------|-----------|---------|
| Matrícula | Número da placa | Texto |
| Modelo | Marca e modelo | Texto |
| Departamento | Departamento responsável | Texto |
| Frota | Nome da frota | Texto |
| Estado | active/maintenance/inactive | Texto |
| Docs Válidos | Contagem | Número |
| Docs A Expirar | Contagem | Número |
| Docs Expirados | Contagem | Número |

#### **Documentos**
| Campo | Descrição | Formato |
|-------|-----------|---------|
| Código | Código único (DOC2025XXXX) | Texto |
| Nome do Documento | Descrição | Texto |
| Tipo | registration/insurance/etc | Texto |
| Veículo | Matrícula | Texto |
| Modelo | Modelo do veículo | Texto |
| Departamento | Departamento | Texto |
| Data de Validade | Data de expiração | dd/MM/yyyy |
| Estado | valid/expiring/expired | Texto |
| Localização | Local de armazenamento | Texto |

#### **Movimentações**
| Campo | Descrição | Formato |
|-------|-----------|---------|
| Motorista | Nome completo | Texto |
| Nº Funcional | Código do funcionário | Texto |
| Departamento | Departamento | Texto |
| Código Documento | Código único | Texto |
| Nome Documento | Descrição | Texto |
| Veículo | Matrícula | Texto |
| Operação | withdrawal/return | Texto |
| Data/Hora Operação | Timestamp | dd/MM/yyyy HH:mm |
| Devolução Esperada | Data prevista | dd/MM/yyyy HH:mm |
| Devolução Real | Data efetiva | dd/MM/yyyy HH:mm |
| Observações | Notas adicionais | Texto |

## 🎨 Formatação Aplicada

### Cores e Estilos
- **Cabeçalhos**: Fundo cinza, texto em negrito
- **Células de dados**: Fundo branco
- **Títulos de resumo**: Mesclados, destacados

### Larguras de Colunas (Otimizadas)
- Códigos: 15 caracteres
- Nomes curtos: 15-20 caracteres
- Nomes completos: 25-30 caracteres
- Observações: 35 caracteres
- Datas: 18-20 caracteres

### Funcionalidades Excel
- ✅ **Autofilter**: Ativado em todas as tabelas
- ✅ **Congelamento**: Linha de cabeçalho fixada
- ✅ **Fórmulas**: Totais e sumários automáticos
- ✅ **Validação**: Dados estruturados e limpos

## 💡 Boas Práticas

### Para Relatórios Periódicos
1. Exporte semanalmente para backup
2. Mantenha histórico de exportações
3. Compare dados mês a mês

### Para Auditorias
1. Exporte dados antes de alterações importantes
2. Documente data e hora da exportação
3. Guarde em local seguro com controlo de acesso

### Para Análise de Dados
1. Use filtros do Excel para segmentar informação
2. Crie tabelas dinâmicas para análise avançada
3. Compare múltiplas exportações para tendências

## 🔒 Segurança e Conformidade

### Dados Incluídos
- ✅ Apenas dados autorizados conforme permissões do utilizador
- ✅ Timestamp de exportação em cada relatório
- ✅ Auditoria: todas as exportações são registadas

### Recomendações
- 🔐 Proteja ficheiros Excel com senha se contêm dados sensíveis
- 📁 Armazene em locais seguros com backup
- 🗑️ Delete ficheiros antigos conforme política de retenção

## 📞 Suporte

Para questões sobre:
- Formatação personalizada
- Campos adicionais
- Integração com outros sistemas
- Problemas técnicos

Contacte o administrador do sistema.

---

**Versão**: 1.0  
**Última Atualização**: Janeiro 2025  
**Sistema**: FleetDocs - Gestão de Documentos de Frota
