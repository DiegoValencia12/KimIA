import { Router } from 'express';

import {
  register,
  login,
  logout,
} from '../controllers/auth.controller.js';

import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);


router.post('/logout', verifyFirebaseToken, logout);

router.get('/profile');
router.get('/verify');
router.patch('/profile');
router.patch('/password');
router.delete('/account');

export default router;