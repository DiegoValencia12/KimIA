import { Router } from 'express'
import {
  register,
  login,
  me,
  verify,
  logout
} from '../controllers/auth.controller.js'
import { authenticateToken } from '../middlewares/authenticateToken.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authenticateToken, me)
router.get('/verify', authenticateToken, verify)
router.post('/logout', authenticateToken, logout)

export default router