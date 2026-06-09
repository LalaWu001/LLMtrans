const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('llmtrans', {
  auth: {
    current: () => ipcRenderer.invoke('auth:current'),
    register: (payload) => ipcRenderer.invoke('auth:register', payload),
    login: (payload) => ipcRenderer.invoke('auth:login', payload),
    logout: () => ipcRenderer.invoke('auth:logout'),
  },
  files: {
    chooseCookie: () => ipcRenderer.invoke('files:choose-cookie'),
    chooseDialogue: () => ipcRenderer.invoke('files:choose-dialogue'),
  },
  conversations: {
    list: () => ipcRenderer.invoke('conversations:list'),
    create: (payload) => ipcRenderer.invoke('conversations:create', payload),
    start: (id) => ipcRenderer.invoke('conversations:start', id),
    stop: () => ipcRenderer.invoke('conversations:stop'),
    status: () => ipcRenderer.invoke('conversations:status'),
  },
  messages: {
    list: (conversationId) => ipcRenderer.invoke('messages:list', conversationId),
    send: (conversationId, content) => ipcRenderer.invoke('messages:send', {conversationId, content}),
  },
  onWorkerStatus: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on('worker:status', wrapped);
    return () => ipcRenderer.removeListener('worker:status', wrapped);
  },
  onMessage: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on('messages:new', wrapped);
    return () => ipcRenderer.removeListener('messages:new', wrapped);
  },
  onWorkerError: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on('worker:error', wrapped);
    return () => ipcRenderer.removeListener('worker:error', wrapped);
  },
});
