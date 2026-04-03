# Migração 006: Campos de Cliente Final em Serviços

## Descrição
Adiciona campos para registrar informações do cliente final quando o serviço é para uma loja.

## Campos Adicionados
- **cliente_final_nome**: Nome do cliente que comprou na loja
- **cliente_final_contato**: Telefone/WhatsApp do cliente
- **codigo_os_loja**: Código da ordem de serviço da loja

## Como Aplicar

### PostgreSQL
```bash
psql -U seu_usuario -d montagex -f 006_add_cliente_final_servicos.sql
```

### Ou via pgAdmin
1. Conecte-se ao banco de dados
2. Execute o conteúdo do arquivo `006_add_cliente_final_servicos.sql`

## Rollback
Se necessário, execute:
```sql
ALTER TABLE servicos
DROP COLUMN IF EXISTS cliente_final_nome,
DROP COLUMN IF EXISTS cliente_final_contato,
DROP COLUMN IF EXISTS codigo_os_loja;

DROP INDEX IF EXISTS idx_servicos_codigo_os_loja;
```

## Impacto
- ✅ Não afeta dados existentes (campos são opcionais)
- ✅ Compatível com versões anteriores
- ✅ Melhora rastreabilidade dos serviços
