const WEBHOOK_URL = 'http://localhost:5678/webhook-test/KimIA/chat';

export async function enviarConsulta(message, sessionId) {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      sessionId
    })
  });

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`);
  }

  const data = await response.json();

  return data.response;
}