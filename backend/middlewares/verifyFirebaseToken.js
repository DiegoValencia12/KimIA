
import { firebaseAuth } from '../config/firebase.js';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticación requerido',
      });
    }

    const token = authorization.split(' ')[1];

    const decodedToken = await firebaseAuth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
    };

    next();
  } catch (error) {
    console.error('Error de autenticación:', error.code || error.message);

    return res.status(401).json({
      error: 'Sesión inválida, expirada o revocada',
    });
  }
};
