# Sistema de Anexos em Serviços

## Descrição

O sistema de anexos permite adicionar, gerenciar e fazer download de arquivos associados a serviços. Suporta múltiplas extensões de arquivo incluindo imagens, documentos, vídeos e áudio.

## Extensões Suportadas

### Imagens
- jpg, jpeg, png, gif, bmp, webp, svg, ico, tiff

### Documentos
- pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv

### Áudio
- mp3, wav, aac, flac, m4a, ogg, wma

### Vídeo
- mp4, avi, mov, mkv, flv, wmv, webm, MOV, MP4

### Compactados
- zip, rar, 7z, tar, gz

## Limites

- **Tamanho máximo por arquivo**: 100 MB
- **Armazenamento**: `/backend/uploads/[servico-id]/`

## Como Usar

### 1. Migração do Banco de Dados

```bash
# Executar migração
node scripts/run-migration-009.js
```

Ou executar manualmente:
```sql
psql -U postgres -d Montagex -f database/migrations/009_servico_anexos.sql
```

### 2. Frontend

No painel de serviços, ao editar um serviço:

1. **Adicionar Anexo**: Clique em "📤 Fazer Upload"
2. **Selecionar Arquivo**: Escolha um arquivo suportado
3. **Download**: Clique em ⬇️ para baixar
4. **Remover**: Clique em 🗑️ para deletar

### 3. API

#### Listar Anexos
```bash
GET /api/anexos/servicos/:servicoId/anexos
```

#### Upload de Arquivo
```bash
POST /api/anexos/servicos/:servicoId/anexos
Content-Type: multipart/form-data

arquivo: <file>
descricao: <optional string>
```

#### Download
```bash
GET /uploads/:servicoId/:nomeArquivo
```

#### Deletar
```bash
DELETE /api/anexos/anexos/:anexoId
```

## Estrutura de Dados

### Tabela: servico_anexos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| servico_id | UUID | Referência ao serviço |
| nome_arquivo | VARCHAR(255) | Nome original do arquivo |
| extensao | VARCHAR(20) | Extensão do arquivo |
| tipo_mime | VARCHAR(100) | Tipo MIME |
| tamanho_bytes | BIGINT | Tamanho em bytes |
| caminho_arquivo | TEXT | Caminho relativo armazenado |
| descricao | TEXT | Descrição opcional |
| criado_em | TIMESTAMP | Data de criação |
| criado_por | UUID | ID do usuário que criou |

## Organização de Arquivos

```
backend/
├── uploads/
│   ├── [servico-id-1]/
│   │   ├── imagem-123.jpg
│   │   ├── documento-456.pdf
│   │   └── video-789.mp4
│   └── [servico-id-2]/
│       └── ...
```

## Segurança

- ✅ Validação de extensão de arquivo
- ✅ Limite de tamanho (100MB)
- ✅ Isolamento por serviço
- ✅ Autenticação JWT obrigatória
- ✅ Validação de path traversal

## Troubleshooting

### Upload falha
- Verifique o tamanho do arquivo (máx 100MB)
- Confirme a extensão permitida
- Verifique permissões da pasta `/backend/uploads`

### Arquivo não aparece
- Confirme que o upload foi bem-sucedido
- Verifique logs do servidor
- Recarregue a página

### Download não funciona
- Verifique se o arquivo existe no disco
- Confirme permissões de leitura
- Verifique o path do arquivo no banco

