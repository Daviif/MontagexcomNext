import { Router } from 'express'
import * as ctrl from './financeiro.controller'
import { authenticate, authorize } from '../../middlewares/auth.middleware'
import { upload } from '../../utils/upload'

const router = Router()

router.use(authenticate)

router.get('/dashboard', ctrl.dashboard)
router.post('/', authorize('ADMIN'), ctrl.criarTransacao)
router.get('/', ctrl.listar)
router.post('/:id/baixas', authorize('ADMIN'), ctrl.registrarBaixa)
router.post('/:id/comprovante', authorize('ADMIN'), upload.single('arquivo'), ctrl.uploadComprovante)

export default router