import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'

const getSecret = () => {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres')
  }

  return secret
}

export const generateToken = (userId) => {
  const jti = randomUUID()

  const token = jwt.sign(
    { sub: userId, jti },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

  const decoded = jwt.decode(token)

  return {
    token,
    jti,
    expiresAt: new Date(decoded.exp * 1000)
  }
}

export const verifyToken = (token) => {
  return jwt.verify(token, getSecret())
}