import { Router } from 'express'
import * as ctrl from './produtos.controller'
import { authenticate, authorize } from '../../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', ctrl.listar)
router.post('/', authorize('ADMIN'), ctrl.criar)
router.put('/:id', authorize('ADMIN'), ctrl.atualizar)

export default router
