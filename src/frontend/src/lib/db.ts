// IndexedDB wrapper for Rivelo Client

const DB_NAME = "rivelo_db";
const DB_VERSION = 1;

export interface Chat {
  id: string;
  title: string;
  model: string;
  systemPrompt?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("chats")) {
        const chatsStore = db.createObjectStore("chats", { keyPath: "id" });
        chatsStore.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("messages")) {
        const msgsStore = db.createObjectStore("messages", { keyPath: "id" });
        msgsStore.createIndex("chatId", "chatId", { unique: false });
        msgsStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function createChat(
  model: string,
  title?: string,
  systemPrompt?: string,
): Promise<Chat> {
  const db = await openDB();
  const chat: Chat = {
    id: generateId(),
    title: title || "New Chat",
    model,
    systemPrompt,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readwrite");
    tx.objectStore("chats").add(chat);
    tx.oncomplete = () => resolve(chat);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getChats(): Promise<Chat[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readonly");
    const req = tx.objectStore("chats").index("updatedAt").getAll();
    req.onsuccess = () => resolve((req.result as Chat[]).reverse());
    req.onerror = () => reject(req.error);
  });
}

export async function getChat(id: string): Promise<Chat | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readonly");
    const req = tx.objectStore("chats").get(id);
    req.onsuccess = () => resolve((req.result as Chat) || null);
    req.onerror = () => reject(req.error);
  });
}

export async function updateChat(
  id: string,
  updates: Partial<Omit<Chat, "id" | "createdAt">>,
): Promise<void> {
  const db = await openDB();
  const existing = await getChat(id);
  if (!existing) return;
  const updated = { ...existing, ...updates, updatedAt: Date.now() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chats", "readwrite");
    tx.objectStore("chats").put(updated);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteChat(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["chats", "messages"], "readwrite");
    tx.objectStore("chats").delete(id);
    const msgIndex = tx.objectStore("messages").index("chatId");
    const req = msgIndex.getAll(id);
    req.onsuccess = () => {
      for (const msg of req.result as Message[]) {
        tx.objectStore("messages").delete(msg.id);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function addMessage(
  chatId: string,
  role: "user" | "assistant" | "system",
  content: string,
): Promise<Message> {
  const db = await openDB();
  const msg: Message = {
    id: generateId(),
    chatId,
    role,
    content,
    timestamp: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readwrite");
    tx.objectStore("messages").add(msg);
    tx.oncomplete = () => resolve(msg);
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateMessage(
  id: string,
  content: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readwrite");
    const store = tx.objectStore("messages");
    const req = store.get(id);
    req.onsuccess = () => {
      const msg = req.result as Message;
      if (msg) {
        store.put({ ...msg, content });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readonly");
    const req = tx.objectStore("messages").index("chatId").getAll(chatId);
    req.onsuccess = () => {
      const msgs = (req.result as Message[]).sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      resolve(msgs);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteMessages(chatId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("messages", "readwrite");
    const msgIndex = tx.objectStore("messages").index("chatId");
    const req = msgIndex.getAll(chatId);
    req.onsuccess = () => {
      for (const msg of req.result as Message[]) {
        tx.objectStore("messages").delete(msg.id);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
