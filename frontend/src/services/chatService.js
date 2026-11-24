import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  const idToken = localStorage.getItem("idToken");

  if (idToken) {
    config.headers.Authorization = `Bearer ${idToken}`;
  }

  return config;
});

function handleError(error) {
  throw new Error(
    error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Error al comunicarse con el servidor",
  );
}

export const listChats = async () => {
  try {
    const response = await api.get("/chats");
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const createChat = async (title = "Nuevo chat") => {
  try {
    const response = await api.post("/chats", { title });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getChatHistory = async (chatId) => {
  try {
    const response = await api.get(`/chats/${encodeURIComponent(chatId)}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const sendChatMessage = async (chatId, content, file = null) => {
  try {
    let response;

    if (file) {
      const formData = new FormData();
      formData.append("content", content || "");
      formData.append("file", file);

      response = await api.post(
        `/chats/${encodeURIComponent(chatId)}/messages`,
        formData,
      );
    } else {
      response = await api.post(
        `/chats/${encodeURIComponent(chatId)}/messages`,
        { content },
      );
    }

    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteChat = async (chatId) => {
  try {
    const response = await api.delete(`/chats/${encodeURIComponent(chatId)}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};
