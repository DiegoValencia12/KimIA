const firebaseErrors =
{
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
};

export const handleFirebaseError = (error, res) =>
{
  const knownError = firebaseErrors[error.code];

  if (knownError)
  {
    return res.status(knownError.status).json({
      error: knownError.message,
    });
  }

  console.error('Error de Firebase:', error.code);

  return res.status(500).json({
    error: 'Ocurrió un error interno del servidor',
  });
};