declare global {
  type Account = {
    id: string;
    accountName: string;
    nickname: string;
    avatarPath: string;
  };

  type WorkerStatus = {
    status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
    conversationId: string | null;
    senderRunning: boolean;
    receiverRunning: boolean;
  };

  type ElectronConversation = {
    id: string;
    name: string;
    cookieFile: string;
    dialogFile: string;
    lastMessage: string;
    unread: number;
    time: string;
    lastError?: string;
  };

  type ElectronMessage = {
    id: string;
    conversationId: string;
    senderAccount: string;
    sender: string;
    text: string;
    origin: 'self' | 'peer' | 'system';
    status: string;
    time: string;
    sentAt: string;
  };

  interface Window {
    llmtrans: {
      auth: {
        current(): Promise<Account | null>;
        register(payload: {accountName: string; nickname: string; password: string}): Promise<Account>;
        login(payload: {accountName: string; password: string}): Promise<Account>;
        logout(): Promise<boolean>;
      };
      files: {
        chooseCookie(): Promise<string | null>;
        chooseDialogue(): Promise<string | null>;
      };
      conversations: {
        list(): Promise<ElectronConversation[]>;
        create(payload: {name: string; cookiePath: string; dialoguePath: string}): Promise<ElectronConversation>;
        start(id: string): Promise<WorkerStatus>;
        stop(): Promise<WorkerStatus>;
        status(): Promise<WorkerStatus>;
      };
      messages: {
        list(conversationId: string): Promise<ElectronMessage[]>;
        send(conversationId: string, content: string): Promise<ElectronMessage>;
      };
      onWorkerStatus(listener: (status: WorkerStatus) => void): () => void;
      onMessage(listener: (message: ElectronMessage) => void): () => void;
      onWorkerError(listener: (error: {conversationId: string | null; message: string}) => void): () => void;
    };
  }
}

export {};
