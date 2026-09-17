import axiosInstance from "../services/url.service";

export const uploadChatFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await axiosInstance.post("/messages/upload", form);
  return data; // {fileUrl, fileType, originalFileName, filePublicId, fileSize}
};

export const sendMessageApi = async (payload) => {
  // payload: {receiverId, message, fileUrl, fileType, originalFileName, filePublicId, fileSize}
  const { data } = await axiosInstance.post("/messages/send", payload);
  return data;
};

export const getChatApi = async (userId, limit = 100, skip = 0) => {
  const { data } = await axiosInstance.get(`/messages/chat/${userId}?limit=${limit}&skip=${skip}`);
  return data;
};

export const getConversationsApi = async () => {
  const { data } = await axiosInstance.get("/messages/conversations");
  return data;
};

export const deleteForMeApi = async (messageId) => {
  const { data } = await axiosInstance.delete(`/messages/delete-me/${messageId}`);
  return data;
};

export const deleteForEveryoneApi = async (messageId) => {
  const { data } = await axiosInstance.delete(`/messages/delete-everyone/${messageId}`);
  return data;
};

export const markSeenApi = async (messageId) => {
  const { data } = await axiosInstance.put(`/messages/seen/${messageId}`);
  return data;
};
