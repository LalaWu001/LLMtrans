const stoppedStatus = (): WorkerStatus => ({
  status: 'stopped',
  conversationId: null,
  senderRunning: false,
  receiverRunning: false,
  fileSenderRunning: false,
  fileReceiverRunning: false,
});

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function timeLabel() {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export function installBrowserBridge() {
  if (window.llmtrans) return;

  let currentAccount: Account | null = null;
  let workerStatus = stoppedStatus();
  const conversations: ElectronConversation[] = [];
  const messages = new Map<string, ElectronMessage[]>();
  const fileTransfers = new Map<string, ElectronFileTransfer[]>();
  const statusListeners = new Set<(status: WorkerStatus) => void>();
  const messageListeners = new Set<(message: ElectronMessage) => void>();
  const fileListeners = new Set<(transfer: ElectronFileTransfer) => void>();

  const emitStatus = () => {
    const snapshot = {...workerStatus};
    statusListeners.forEach((listener) => listener(snapshot));
  };

  window.llmtrans = {
    auth: {
      async current() {
        return currentAccount;
      },
      async register({accountName, nickname}) {
        if (!accountName.trim() || !nickname.trim()) throw new Error('Please enter an account name and nickname.');
        currentAccount = {
          id: createId(),
          accountName: accountName.trim(),
          nickname: nickname.trim(),
          avatarPath: '',
        };
        return currentAccount;
      },
      async login({accountName}) {
        if (!accountName.trim()) throw new Error('Please enter an account name.');
        currentAccount = {
          id: createId(),
          accountName: accountName.trim(),
          nickname: accountName.trim(),
          avatarPath: '',
        };
        return currentAccount;
      },
      async logout() {
        currentAccount = null;
        workerStatus = stoppedStatus();
        emitStatus();
        return true;
      },
    },
    files: {
      async chooseCookie() {
        return 'browser-preview/cookies.json';
      },
      async chooseDialogue() {
        return 'browser-preview/dialogue.txt';
      },
      async chooseSend() {
        return 'browser-preview/example.txt';
      },
      async list(conversationId) {
        return [...(fileTransfers.get(conversationId) ?? [])];
      },
      async send(conversationId, filePath) {
        if (!currentAccount) throw new Error('Please sign in first.');
        const transfer: ElectronFileTransfer = {
          id: createId(),
          conversationId,
          senderAccount: currentAccount.accountName,
          sender: currentAccount.nickname,
          fileName: filePath.split(/[\\/]/).pop() || 'example.txt',
          filePath,
          direction: 'self',
          status: 'sent',
          errorMessage: '',
          time: timeLabel(),
          sentAt: new Date().toISOString(),
        };
        fileTransfers.set(conversationId, [...(fileTransfers.get(conversationId) ?? []), transfer]);
        fileListeners.forEach((listener) => listener({...transfer}));
        return transfer;
      },
      async openLocation() {
        return true;
      },
      async open() {
        return true;
      },
    },
    conversations: {
      async list() {
        return conversations.map((conversation) => ({...conversation}));
      },
      async create({name, cookiePath, dialoguePath}) {
        const conversation: ElectronConversation = {
          id: createId(),
          name: name.trim() || 'Browser Preview',
          cookieFile: cookiePath,
          dialogFile: dialoguePath,
          lastMessage: 'Ready for browser preview',
          unread: 0,
          time: timeLabel(),
        };
        conversations.unshift(conversation);
        messages.set(conversation.id, []);
        fileTransfers.set(conversation.id, []);
        return {...conversation};
      },
      async start(id) {
        if (!conversations.some((conversation) => conversation.id === id)) {
          throw new Error('Create or select a conversation first.');
        }
        workerStatus = {
          status: 'running',
          conversationId: id,
          senderRunning: true,
          receiverRunning: true,
          fileSenderRunning: true,
          fileReceiverRunning: true,
        };
        emitStatus();
        return {...workerStatus};
      },
      async stop() {
        workerStatus = stoppedStatus();
        emitStatus();
        return {...workerStatus};
      },
      async status() {
        return {...workerStatus};
      },
    },
    messages: {
      async list(conversationId) {
        return [...(messages.get(conversationId) ?? [])];
      },
      async send(conversationId, content) {
        if (!currentAccount) throw new Error('Please sign in first.');
        if (workerStatus.status !== 'running' || workerStatus.conversationId !== conversationId) {
          throw new Error('Start the selected conversation before sending.');
        }
        const message: ElectronMessage = {
          id: createId(),
          conversationId,
          senderAccount: currentAccount.accountName,
          sender: currentAccount.nickname,
          text: content,
          origin: 'self',
          status: 'sent',
          time: timeLabel(),
          sentAt: new Date().toISOString(),
        };
        messages.set(conversationId, [...(messages.get(conversationId) ?? []), message]);
        const conversation = conversations.find((item) => item.id === conversationId);
        if (conversation) {
          conversation.lastMessage = content;
          conversation.time = message.time;
        }
        return {...message};
      },
    },
    onWorkerStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    onMessage(listener) {
      messageListeners.add(listener);
      return () => messageListeners.delete(listener);
    },
    onWorkerError() {
      return () => {};
    },
    onFileChanged(listener) {
      fileListeners.add(listener);
      return () => fileListeners.delete(listener);
    },
  };
}
