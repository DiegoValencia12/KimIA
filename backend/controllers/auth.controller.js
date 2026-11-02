
import {
  registerUser,
  loginUser,
  getUserById,
  logoutUser
} from '../services/auth.service.js'

const handleError = (error, res, operation) => {
  console.error(`[AUTH] Error en ${operation}:`, error)

  if (error.status && error.status < 500) {
    return res.status(error.status).json({
      error: error.message
    })
  }

  return res.status(500).json({
    error: 'Ha ocurrido un error interno. Inténtalo más tarde.'
  })
}

export const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body

    if (!email?.trim() || !password || !displayName?.trim()) {
      return res.status(400).json({
        error: 'El nombre, correo y contraseña son obligatorios'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres'
      })
    }

    const user = await registerUser({
      email,
      password,
      displayName
    })

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user
    })
  } catch (error) {
    return handleError(error, res, 'registro')
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email?.trim() || !password) {
      return res.status(400).json({
        error: 'El correo y la contraseña son obligatorios'
      })
    }

    const session = await loginUser({
      email,
      password
    })

    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      ...session
    })
  } catch (error) {
    return handleError(error, res, 'inicio de sesión')
  }
}

export const me = async (req, res) => {
  try {
    const user = await getUserById(req.user.uid)

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      })
    }

    return res.status(200).json({ user })
  } catch (error) {
    return handleError(error, res, 'consulta de usuario')
  }
}

export const verify = async (req, res) => {
  return res.status(200).json({
    valid: true,
    user: req.user
  })
}

export const logout = async (req, res) => {
  try {
    await logoutUser(req.auth.jti)

    return res.status(200).json({
      message: 'Sesión cerrada correctamente'
    })
  } catch (error) {
    return handleError(error, res, 'cierre de sesión')
  }
}
