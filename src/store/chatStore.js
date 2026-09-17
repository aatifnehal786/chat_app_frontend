import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import useStore from "./layoutStore";
import { getChatApi, getConversationsApi, sendMessageApi, uploadChatFile, deleteForEveryoneApi,deleteForMeApi } from "../services/message.service";

export const useChatStore = create((set, get) => ({
  conversations: { data: [] },
  messages: [],
  loading: false,
  onlineUsers: new Map(),
  typingUsers: new Map(),

  fetchConversations: async () => {
    try {
      const data = await getConversationsApi();
      const list = data.data || data || [];
      set({ conversations: { data: list } });
    } catch (e) { console.error(e); }
  },

  fetchMessages: async (userId) => {
    set({ loading: true });
    try {
      const data = await getChatApi(userId);
      const list = data.data || data || [];
      set({ messages: list, loading: false });
      return list;
    } catch (e) {
      set({ loading: false });
      console.error(e);
    }
  },

  sendMessage: async ({ receiverId, message, file }) => {
    try {
      let fileData = null;
      if (file) {
        fileData = await uploadChatFile(file);
      }
      const payload = { receiverId, message: message || "", ...(fileData || {}) };
      const res = await sendMessageApi(payload);
      const newMsg = res.data || res;

      // Add to own chat immediately
      set((state) => ({
        messages: state.messages.some(m => m._id === newMsg._id)
          ? state.messages
          : [...state.messages, newMsg]
      }));

      // Emit for receiver
      const socket = getSocket();
      socket?.emit("send_message", newMsg);

      // Update conversation list
      get().fetchConversations();
      return newMsg;
    } catch (e) { throw e; }
  },

  receiveMessage: (msg) => {
    const selectedContact = useStore.getState().selectedContact;
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    // Check if this message belongs to currently open chat
    const isForCurrentChat = 
      (msg.sender === selectedContact?._id || msg.sender?._id === selectedContact?._id || msg.receiver === selectedContact?._id || msg.receiver?._id === selectedContact?._id) ||
      (msg.sender === currentUser._id);

    console.log("Received message:", msg, "For current chat:", isForCurrentChat);

    if (isForCurrentChat || !selectedContact) {
      set((state) => {
        if (state.messages.some(m => m._id === msg._id)) return state;
        return { messages: [...state.messages, msg] };
      });
    }
    
    // Always refresh conversations to show last message
    get().fetchConversations();
  },
    deleteMessage: async (messageId, forEveryone = false) => {
    try {
      if (forEveryone) {
        await deleteForEveryoneApi(messageId);
      } else {
        await deleteForMeApi(messageId);
      }
      
      // Optimistic update
      set((state) => ({
        messages: forEveryone
          ? state.messages.map(m => m._id === messageId ? { ...m, isDeleted: true, message: "This message was deleted", fileUrl: null } : m)
          : state.messages.filter((m) => m._id !== messageId),
      }));
    } catch (e) {
      console.error("Delete failed", e.response?.data || e.message);
      alert(e.response?.data?.error || "Failed to delete");
    }
  },

  isUserOnline: (userId) => get().onlineUsers.get(userId?.toString())?.isOnline || false,
  getUserLastSeen: (userId) => get().onlineUsers.get(userId?.toString())?.lastSeen || null,
  isUserTyping: (userId) => get().typingUsers.has(userId?.toString()),

  startTyping: (receiverId) => {
    const socket = getSocket();
    socket?.emit("typing", { senderId: useStore.getState().user?._id, receiverId });
  },
  stopTyping: (receiverId) => {
    const socket = getSocket();
    socket?.emit("stopTyping", { senderId: useStore.getState().user?._id, receiverId });
  },

  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    // Clear old listeners
    socket.removeAllListeners("receiveMessage");
    socket.removeAllListeners("newMessage");
    socket.removeAllListeners("new_message");
    socket.removeAllListeners("user_status");
    socket.removeAllListeners("user-online");
    socket.removeAllListeners("user-offline");
    socket.removeAllListeners("typing");
    socket.removeAllListeners("stopTyping");
    socket.removeAllListeners("typing_start");
    socket.removeAllListeners("typing_stop");

    console.log("Init socket listeners");

    const onMessage = (msg) => {
      console.log("Socket got message:", msg);
      get().receiveMessage(msg);
    };

    socket.on("receiveMessage", onMessage);
    socket.on("newMessage", onMessage);
    socket.on("new_message", onMessage);
socket.on("conversationUpdated", () => {
  get().fetchConversations();
});
    socket.on("user-online", ({ userId }) => {
      set(s => {
        const m = new Map(s.onlineUsers);
        m.set(userId, { isOnline: true, lastSeen: null });
        return { onlineUsers: m };
      });
    });

    socket.on("user-offline", ({ userId, lastSeen }) => {
      set(s => {
        const m = new Map(s.onlineUsers);
        m.set(userId, { isOnline: false, lastSeen });
        return { onlineUsers: m };
      });
    });

    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set(s => {
        const m = new Map(s.onlineUsers);
        m.set(userId, { isOnline, lastSeen });
        return { onlineUsers: m };
      });
    });

    socket.on("online-users", (ids) => {
      set(s => {
        const m = new Map(s.onlineUsers);
        ids.forEach(id => m.set(id, { isOnline: true, lastSeen: null }));
        return { onlineUsers: m };
      });
    });

    socket.on("typing", (data) => {
      const id = data.senderId || data;
      set(s => { const m = new Map(s.typingUsers); m.set(id.toString(), true); return { typingUsers: m }; });
    });

    socket.on("typing_start", (data) => {
      const id = data.senderId || data;
      set(s => { const m = new Map(s.typingUsers); m.set(id.toString(), true); return { typingUsers: m }; });
    });

    socket.on("stopTyping", (data) => {
      const id = data.senderId || data;
      set(s => { const m = new Map(s.typingUsers); m.delete(id.toString()); return { typingUsers: m }; });
    });

    socket.on("typing_stop", (data) => {
      const id = data.senderId || data;
      set(s => { const m = new Map(s.typingUsers); m.delete(id.toString()); return { typingUsers: m }; });
    });
  },
}));