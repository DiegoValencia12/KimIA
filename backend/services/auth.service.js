
import { firebaseAuth } from '../config/firebase.js';

export const registerUser = async ({ email, password, displayName }) =>
{
  return await firebaseAuth.createUser(
  {
    email,
    password,
    ...(displayName ? { displayName } : {}),
  });
};

export const loginUser = async ({ email, password }) => {
  const apiKey = process.env.FIREBASE_API_KEY;

  if (!apiKey) {
    const error = new Error('FIREBASE_API_KEY no está configurada');
    error.code = 'auth/configuration-not-found';
    throw error;
  }

  let response;

  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );
  } catch (cause) {
    const error = new Error('No se pudo conectar con Firebase Authentication');
    error.code = 'auth/network-request-failed';
    error.cause = cause;
    throw error;
  }

  let data;

  try {
    data = await response.json();
  } catch {
    const error = new Error('Firebase devolvió una respuesta no válida');
    error.code = 'auth/invalid-response';
    throw error;
  }

  if (!response.ok) {
    const firebaseMessage = data.error?.message || 'UNKNOWN_ERROR';

    const firebaseErrors = {
      INVALID_LOGIN_CREDENTIALS: 'auth/invalid-credential',
      EMAIL_NOT_FOUND: 'auth/user-not-found',
      INVALID_PASSWORD: 'auth/wrong-password',
      USER_DISABLED: 'auth/user-disabled',
      TOO_MANY_ATTEMPTS_TRY_LATER: 'auth/too-many-requests',
      API_KEY_INVALID: 'auth/invalid-api-key',
      OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
    };

    const error = new Error(firebaseMessage);
    error.code = firebaseErrors[firebaseMessage] || 'auth/unknown';

    throw error;
  }

  return data;
};



export const logoutUser = async (uid) =>
  {
  if (!uid)
  {
    const error = new Error('Identificador de usuario requerido');
    error.code = 'auth/invalid-uid';
    throw error;
  }

  await firebaseAuth.revokeRefreshTokens(uid);

  return{
    success: true,
    message: 'Sesión cerrada correctamente',
  };
};
