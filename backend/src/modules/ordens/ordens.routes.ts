import { Router } from 'express'
import * as ctrl from './ordens.controller'
import { authenticate } from '../../middlewares/auth.middleware'

const router = Router()

// Rastreio público — sem autenticação
router.get('/rastrear/:codigo', ctrl.rastrear)

// Demais rotas protegidas
router.use(authenticate)
router.post('/', ctrl.criar)
router.get('/', ctrl.listar)
router.get('/:id', ctrl.buscar)
router.patch('/:id/status', ctrl.atualizarStatus)

export default router