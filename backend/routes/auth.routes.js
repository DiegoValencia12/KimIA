import { Router } from 'express';
import { register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);

router.post('/login');
router.get('/profile');
router.get('/verify');
router.patch('/profile');
router.patch('/password');
router.delete('/account');

export default router;