const firebaseErrors = {
  'auth/email-already-exists': {
    status: 409,
    message: 'Este correo ya está registrado',
  },
  'auth/invalid-email': {
    status: 400,
    message: 'El correo electrónico no es válido',
  },
  'auth/invalid-password': {
    status: 400,
    message: 'La contraseña no cumple los requisitos',
  },
  'auth/user-not-found': {
    status: 404,
    message: 'No se encontró el usuario',
  },
  'auth/invalid-uid': {
    status: 400,
    message: 'El identificador del usuario no es válido',
  },
  'auth/id-token-revoked': {
    status: 401,
    message: 'La sesión ya fue revocada',
  },
  'auth/id-token-expired': {
    status: 401,
    message: 'El token ha expirado',
  },
};

export const handleFirebaseError = (error, res) => {
  console.error('Error de Firebase:', {
    code: error.code,
    message: error.message,
  });

  const knownError = firebaseErrors[error.code];

  if (knownError) {
    return res.status(knownError.status).json({
      error: knownError.message,
    });
  }

  return res.status(500).json({
    error: 'Ocurrió un error interno del servidor',
  });
};