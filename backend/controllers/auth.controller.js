import { registerUser, loginUser, logoutUser } from '../services/auth.service.js';
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


export const login = async (req, res) =>
{
  try
  {
    const { email, password } = req.body;

    if (!email || !password)
    {
      return res.status(400).json({
        error: 'El correo y la contraseña son obligatorios',
      });
    }

    const session = await loginUser({
      email,
      password,
    });

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user: {
        uid: session.localId,
        email: session.email,
        displayName: session.displayName ?? null,
      },
      tokens: {
        idToken: session.idToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
      },
    });
  } catch (error) {
    return handleFirebaseError(error, res);
  }
};


export const logout = async (req, res) =>
{
  try
  {
    const uid = req.user.uid;

    await logoutUser(uid);

    return res.status(200).json({
      message: 'Sesión cerrada correctamente',
    });
  }
  catch (error)
  {
    return handleFirebaseError(error, res);
  }
};