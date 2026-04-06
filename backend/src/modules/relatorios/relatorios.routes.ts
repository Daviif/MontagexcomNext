import { Router } from 'express'
import * as ctrl from './relatorios.controller'
import { authenticate, authorize } from '../../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)
router.post('/', authorize('ADMIN'), ctrl.solicitar)

export default router
