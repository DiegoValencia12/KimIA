import { verifyToken } from '../utils/jwt.js'
import Session from '../models/Session.js'
import User from '../models/User.js'

export const authenticateToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de autenticación requerido'
      })
    }

    const token = authorization.split(' ')[1]
    const decoded = verifyToken(token)

    const session = await Session.findOne({
      jti: decoded.jti,
      userId: decoded.sub,
      expiresAt: { $gt: new Date() }
    })

    if (!session) {
      return res.status(401).json({
        error: 'Sesión inválida, expirada o revocada'
      })
    }

    const user = await User.findById(decoded.sub)
      .select('_id email displayName')

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      })
    }

    req.user = {
      uid: user._id.toString(),
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName
    }

    req.auth = {
      jti: decoded.jti
    }

    next()
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido o expirado'
    })
  }
}