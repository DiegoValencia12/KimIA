import { registerUser } from '../services/auth.service.js';
import { handleFirebaseError } from '../utils/firebaseErrorHandler.js';

export const register = async (req, res) =>
{
  try
  {
    const { email, password, displayName } = req.body;

    if (!email || !password)
    {
      return res.status(400).json({
        error: 'El correo y la contraseña son obligatorios',
      });
    }

    const user = await registerUser({
      email,
      password,
      displayName: displayName?.trim(),
    });

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  }
  catch (error)
  {
    return handleFirebaseError(error, res);
  }
};