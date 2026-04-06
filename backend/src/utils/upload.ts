import multer from 'multer'
import path from 'path'
import { AppError } from '../middlewares/error.middleware'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf']
const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10 MB

export const upload = multer({
  storage: multer.memoryStorage(), // buffer em memória → enviamos direto para MinIO/S3
  limits: { fileSize: TAMANHO_MAXIMO },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new AppError('Tipo de arquivo não permitido. Use JPG, PNG ou PDF.', 422, 'INVALID_FILE_TYPE'))
    }
    cb(null, true)
  },
})

export function nomeArquivo(original: string, prefixo = ''): string {
  const ext = path.extname(original)
  const base = Date.now().toString(36) + Math.random().toString(36).slice(2)
  return `${prefixo}${base}${ext}`.toLowerCase()
}