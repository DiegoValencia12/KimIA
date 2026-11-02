import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Session from '../models/Session.js'
import { generateToken } from '../utils/jwt.js'

export const registerUser = async ({ email, password, displayName }) => {
  const normalizedEmail = email.trim().toLowerCase()

  const existingUser = await User.findOne({
    email: normalizedEmail
  })

  if (existingUser) {
    const error = new Error('El correo ya está registrado')
    error.status = 409
    throw error
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    displayName: displayName.trim()
  })

  return {
    uid: user._id.toString(),
    email: user.email,
    displayName: user.displayName
  }
}

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await User.findOne({
    email: normalizedEmail
  }).select('+passwordHash')

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error('Correo o contraseña incorrectos')
    error.status = 401
    throw error
  }

  const { token, jti, expiresAt } = generateToken(user._id.toString())

  await Session.create({
    userId: user._id,
    jti,
    expiresAt
  })

  return {
    user: {
      uid: user._id.toString(),
      email: user.email,
      displayName: user.displayName
    },
    tokens: {
      idToken: token,
      expiresAt
    }
  }
}

export const getUserById = async (uid) => {
  const user = await User.findById(uid)
    .select('_id email displayName createdAt')

  if (!user) return null

  return {
    uid: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt
  }
}

export const logoutUser = async (jti) => {
  await Session.deleteOne({ jti })
}