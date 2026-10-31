
const firebaseErrors = {
  'auth/email-already-exists': {
    status: 409,
    message: 'Este correo ya está registrado'
  },
  'auth/invalid-email': {
    status: 400,
    message: 'El correo electrónico no es válido'
  },
  'auth/invalid-password': {
    status: 400,
    message: 'La contraseña no cumple los requisitos'
  },
  'auth/weak-password': {
    status: 400,
    message: 'La contraseña debe tener al menos 6 caracteres'
  },
  'auth/user-not-found': {
    status: 401,
    message: 'El correo o la contraseña son incorrectos'
  },
  'auth/wrong-password': {
    status: 401,
    message: 'El correo o la contraseña son incorrectos'
  },
  'auth/invalid-credential': {
    status: 401,
    message: 'El correo o la contraseña son incorrectos'
  },
  'auth/invalid-uid': {
    status: 400,
    message: 'El identificador del usuario no es válido'
  },
  'auth/id-token-revoked': {
    status: 401,
    message: 'La sesión ya fue revocada'
  },
  'auth/id-token-expired': {
    status: 401,
    message: 'El token ha expirado'
  },
  EMAIL_EXISTS: {
    status: 409,
    message: 'Este correo ya está registrado'
  },
  EMAIL_NOT_FOUND: {
    status: 401,
    message: 'El correo o la contraseña son incorrectos'
  },
  INVALID_PASSWORD: {
    status: 401,
    message: 'El correo o la contraseña son incorrectos'
  },
  INVALID_LOGIN_CREDENTIALS: {
    status: 401,
    message: 'El correo o la contraseña son incorrectos'
  },
  INVALID_EMAIL: {
    status: 400,
    message: 'El correo electrónico no es válido'
  },
  WEAK_PASSWORD: {
    status: 400,
    message: 'La contraseña debe tener al menos 6 caracteres'
  },
  TOO_MANY_ATTEMPTS_TRY_LATER: {
    status: 429,
    message: 'Demasiados intentos. Inténtalo más tarde'
  },
  USER_DISABLED: {
    status: 403,
    message: 'Esta cuenta ha sido deshabilitada'
  }
}

export const handleFirebaseError = (error, res) => {
  const code =
    error.code ||
    error.response?.data?.error?.message ||
    error.response?.data?.error ||
    error.message

  console.error('Error de Firebase:', {
    code,
    message: error.message
  })

  const knownError = firebaseErrors[code]

  if (knownError) {
    return res.status(knownError.status).json({
      error: knownError.message
    })
  }

  return res.status(500).json({
    error: 'No se pudo completar la operación. Inténtalo nuevamente'
  })
}
