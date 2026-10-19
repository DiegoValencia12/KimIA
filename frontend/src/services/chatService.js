
const API_URL = 'http://localhost:3000/api'

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.error || `Error HTTP ${response.status}`
    )
  }

  return data
}

export function listChats() {
  return request('/chats')
}

export function createChat(title = 'Nuevo chat') {
  return request('/chats', {
    method: 'POST',
    body: JSON.stringify({ title })
  })
}

export function getChatHistory(chatId) {
  return request(`/chats/${encodeURIComponent(chatId)}`)
}

export function sendChatMessage(chatId, content) {
  return request(
    `/chats/${encodeURIComponent(chatId)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ content })
    }
  )
}


export function deleteChat(chatId) {
  return request(`/chats/${encodeURIComponent(chatId)}`, {
    method: 'DELETE'
  })
}




