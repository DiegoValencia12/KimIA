
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

function getErrorMessage(error, fallback) {
  const data = error.response?.data

  if (typeof data === 'string') {
    return data
  }

  return (
    data?.message ||
    data?.error ||
    error.message ||
    fallback
  )
}

export const register = async ({ email, password, displayName }) => {
  try {
    const response = await api.post('/auth/register', {
      email,
      password,
      displayName
    })

    return response.data
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'No se pudo registrar el usuario.')
    )
  }
}

export const login = async ({ email, password }) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    })

    return response.data
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'No se pudo iniciar sesión.')
    )
  }
}

export const logout = async (idToken) => {
  try {
    const response = await api.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      }
    )

    return response.data
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'No se pudo cerrar sesión.')
    )
  }
}

export const verifySession = async (idToken) => {
  try {
    const response = await api.get('/auth/verify', {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    })

    return response.data
  } catch (error) {
    throw new Error(
      getErrorMessage(error, 'Sesión expirada o inválida.')
    )
  }
}
