
<template>
  <div class="auth-container">
    <div class="auth-content">
      <div class="auth-header">
        <h2>{{ isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta' }}</h2>
        <p>
          {{
            isLogin
              ? 'Ingresa tus datos para continuar.'
              : 'Regístrate para comenzar a utilizar KIMIA.'
          }}
        </p>
      </div>

      <div class="auth-tabs">
        <button
          type="button"
          :class="{ active: isLogin }"
          @click="changeMode(true)"
        >
          Iniciar sesión
        </button>

        <button
          type="button"
          :class="{ active: !isLogin }"
          @click="changeMode(false)"
        >
          Registrarse
        </button>
      </div>

      <form v-if="isLogin" class="auth-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="login-email">Correo electrónico</label>
          <div class="input-wrapper">
            <img src="/icons/mail.svg" alt="" />
            <input
              id="login-email"
              v-model.trim="loginForm.email"
              type="email"
              placeholder="tu@correo.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <div class="input-wrapper">
            <img src="/icons/lock.svg" alt="" />
            <input
              id="login-password"
              v-model="loginForm.password"
              :type="showLoginPassword ? 'text' : 'password'"
              placeholder="Ingresa tu contraseña"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="showLoginPassword = !showLoginPassword"
            >
              <img
                :src="showLoginPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'"
                alt="Mostrar u ocultar contraseña"
              />
            </button>
          </div>
        </div>

        <div class="forgot-password">
          <button type="button" @click="handleForgotPassword">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button class="submit-button" type="submit" :disabled="submitting">
          {{ submitting ? 'Ingresando...' : 'Iniciar sesión' }}
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="register-username">Nombre de usuario</label>
          <div class="input-wrapper">
            <img src="/icons/user.svg" alt="" />
            <input
              id="register-username"
              v-model.trim="registerForm.username"
              type="text"
              placeholder="Tu nombre de usuario"
              autocomplete="username"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="register-email">Correo electrónico</label>
          <div class="input-wrapper">
            <img src="/icons/mail.svg" alt="" />
            <input
              id="register-email"
              v-model.trim="registerForm.email"
              type="email"
              placeholder="tu@correo.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="register-password">Contraseña</label>
          <div class="input-wrapper">
            <img src="/icons/lock.svg" alt="" />
            <input
              id="register-password"
              v-model="registerForm.password"
              :type="showRegisterPassword ? 'text' : 'password'"
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
              required
              minlength="6"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showRegisterPassword = !showRegisterPassword"
            >
              <img
                :src="showRegisterPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'"
                alt="Mostrar u ocultar contraseña"
              />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirmar contraseña</label>
          <div class="input-wrapper">
            <img src="/icons/lock.svg" alt="" />
            <input
              id="confirm-password"
              v-model="registerForm.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="Repite tu contraseña"
              autocomplete="new-password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <img
                :src="showConfirmPassword ? '/icons/eye-off.svg' : '/icons/eye.svg'"
                alt="Mostrar u ocultar contraseña"
              />
            </button>
          </div>
        </div>

        <button class="submit-button" type="submit" :disabled="submitting">
          {{ submitting ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>

import { ref } from 'vue'
import { register } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const notifications = useNotificationStore()
const router = useRouter()

const emit = defineEmits([
  'register-success',
  'forgot-password'
])

const isLogin = ref(true)
const submitting = ref(false)

const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showConfirmPassword = ref(false)

const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

function changeMode(loginMode) {
  isLogin.value = loginMode
  submitting.value = false
}

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) {
    notifications.warning('Completa todos los campos.')
    return
  }

  submitting.value = true

  try {
    await authStore.login({
      email: loginForm.value.email,
      password: loginForm.value.password
    })

    notifications.success('Has iniciado sesión correctamente.')
    await router.push({ name: 'dashboard' })
  } catch (error) {
    notifications.error(error.message || 'No se pudo iniciar sesión.')
  } finally {
    submitting.value = false
  }
}

async function handleRegister() {
  const { username, email, password, confirmPassword } = registerForm.value

  if (!username || !email || !password || !confirmPassword) {
    notifications.warning('Completa todos los campos.')
    return
  }

  if (password.length < 6) {
    notifications.warning('La contraseña debe tener al menos 6 caracteres.')
    return
  }

  if (password !== confirmPassword) {
    notifications.warning('Las contraseñas no coinciden.')
    return
  }

  submitting.value = true

  try {
    const response = await register({
      email,
      password,
      displayName: username
    })

    notifications.success('Tu cuenta se ha creado correctamente.')

    registerForm.value = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }

    emit('register-success', response)
    changeMode(true)
  } catch (error) {
    notifications.error(error.message || 'No se pudo crear la cuenta.')
  } finally {
    submitting.value = false
  }
}

function handleForgotPassword() {
  emit('forgot-password', loginForm.value.email)
}

</script>

<style scoped>
.auth-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: 30px 20px;
  background: #09090b;
  color: #fafafa;
  font-family: Inter, sans-serif;
}

.auth-content {
  width: 100%;
  max-width: 420px;
}

.auth-header {
  margin-bottom: 32px;
}

.auth-header h2 {
  margin: 0 0 10px;
  color: #fafafa;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.8px;
}

.auth-header p {
  margin: 0;
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.6;
}

.auth-tabs {
  display: flex;
  gap: 5px;
  padding: 5px;
  margin-bottom: 30px;
  border: 1px solid #27272a;
  border-radius: 10px;
  background: #111113;
}

.auth-tabs button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #71717a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-tabs button:hover {
  color: #fafafa;
}

.auth-tabs button.active {
  background: #27272a;
  color: #fafafa;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.form-group label {
  color: #d4d4d8;
  font-size: 13px;
  font-weight: 600;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid #27272a;
  border-radius: 9px;
  background: #111113;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #6366f1;
}

.input-wrapper > img {
  width: 18px;
  height: 18px;
  opacity: 0.65;
}

.input-wrapper input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #fafafa;
  font-size: 13px;
}

.input-wrapper input::placeholder {
  color: #71717a;
}

.password-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.password-toggle img {
  width: 18px;
  height: 18px;
  opacity: 0.65;
}

.forgot-password {
  display: flex;
  justify-content: flex-end;
  margin-top: -8px;
}

.forgot-password button {
  padding: 0;
  border: none;
  background: transparent;
  color: #818cf8;
  font-size: 12px;
  cursor: pointer;
}

.forgot-password button:hover {
  color: #a5b4fc;
}

.submit-button {
  width: 100%;
  height: 48px;
  margin-top: 5px;
  border: none;
  border-radius: 9px;
  background: #4338ca;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  background: #4f46e5;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 400px) {
  .auth-container {
    padding: 25px 18px;
  }

  .auth-header h2 {
    font-size: 24px;
  }

  .brand {
    margin-bottom: 32px;
  }
}
</style>
