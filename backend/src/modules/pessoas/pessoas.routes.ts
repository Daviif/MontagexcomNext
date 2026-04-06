import { Router } from 'express'
import * as ctrl from './pessoas.controller'
import { authenticate, authorize } from '../../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/', authorize('ADMIN'), ctrl.criarCliente)
router.get('/', ctrl.listarClientes)
router.get('/:id', ctrl.buscarCliente)
router.post('/colaboradores', authorize('ADMIN'), ctrl.criarColaborador)
router.get('/colaboradores', ctrl.listarColaboradores)
router.post('/lojas', authorize('ADMIN'), ctrl.criarLoja)
router.patch('/:id', authorize('ADMIN'), ctrl.atualizar)
router.delete('/:id', authorize('ADMIN'), ctrl.remover)

export default router
