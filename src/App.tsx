import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Bot,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  Cookie,
  FileText,
  FolderOpen,
  Gauge,
  Info,
  Lock,
  Languages,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Palette,
  Paperclip,
  Plug,
  Power,
  Route,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  Sun,
  Sparkles,
  Moon,
  UserCircle,
  Users,
} from 'lucide-react';

type Page = 'project' | 'chat' | 'vpn' | 'settings' | 'about';
type AuthMode = 'login' | 'register';
type ThemeChoice = 'Dark Glass' | 'Light' | 'High Contrast' | 'Blue Research';
type ProxyMode = 'Global' | 'Rule-based' | 'Direct' | 'Research Tunnel';
type AiProvider = 'Doubao' | 'Other AI' | 'Custom Provider';
type Language = 'zh' | 'en';
const THEME_STORAGE_KEY = 'llmtrans-theme';
const LANGUAGE_STORAGE_KEY = 'llmtrans-language';

const LanguageContext = createContext<{
  language: Language;
  toggleLanguage: () => void;
}>({
  language: 'zh',
  toggleLanguage: () => {},
});

function loadLanguage(): Language {
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'zh';
}

function useCopy() {
  const context = useContext(LanguageContext);
  return {
    ...context,
    t: (zh: string, en: string) => context.language === 'zh' ? zh : en,
  };
}

function loadThemeChoice(): ThemeChoice {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'Dark Glass' || stored === 'Light' || stored === 'High Contrast' || stored === 'Blue Research'
    ? stored
    : 'Dark Glass';
}

type Conversation = {
  id: string;
  name: string;
  cookieFile: string;
  dialogFile: string;
  lastMessage: string;
  unread: number;
  time: string;
  lastError?: string;
};
type ChatMessage = {
  id: string;
  origin: 'self' | 'peer' | 'system';
  senderAccount: string;
  sender: string;
  text: string;
  time: string;
  status?: string;
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [page, setPage] = useState<Page>('project');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(loadThemeChoice);
  const [language, setLanguage] = useState<Language>(loadLanguage);
  const [aiProvider, setAiProvider] = useState<AiProvider>('Doubao');
  const [proxyMode, setProxyMode] = useState<ProxyMode>('Rule-based');
  const [vpnConnected, setVpnConnected] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [fileTransfers, setFileTransfers] = useState<Record<string, ElectronFileTransfer[]>>({});
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({
    status: 'stopped',
    conversationId: null,
    senderRunning: false,
    receiverRunning: false,
    fileSenderRunning: false,
    fileReceiverRunning: false,
  });
  const [appError, setAppError] = useState('');
  const backgroundStyle = {
    '--dark-background-image': `url("${new URL('./backgrounds/main-bg.jpg', document.baseURI).href}")`,
    '--light-background-image': `url("${new URL('./backgrounds/light-bg.jpg', document.baseURI).href}")`,
  } as React.CSSProperties;

  const activeConversation = conversations.find((item) => item.id === activeConversationId) ?? conversations[0];

  const logout = async () => {
    try {
      await window.llmtrans.auth.logout();
      setAuthenticated(false);
      setAuthMode('login');
      setPage('project');
      setAccountName('');
      setNickname('');
      setConversations([]);
      setActiveConversationId('');
      setMessages({});
      setFileTransfers({});
      setWorkerStatus({
        status: 'stopped',
        conversationId: null,
        senderRunning: false,
        receiverRunning: false,
        fileSenderRunning: false,
        fileReceiverRunning: false,
      });
      setAppError('');
    } catch (error) {
      setAppError(error instanceof Error ? error.message : String(error));
    }
  };

  const loadConversations = async () => {
    const items = await window.llmtrans.conversations.list();
    setConversations(items);
    setActiveConversationId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id ?? '');
  };

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return;
    const items = await window.llmtrans.messages.list(conversationId);
    setMessages((current) => ({...current, [conversationId]: items}));
  };

  const loadFileTransfers = async (conversationId: string) => {
    if (!conversationId) return;
    const items = await window.llmtrans.files.list(conversationId);
    setFileTransfers((current) => ({...current, [conversationId]: items}));
  };

  useEffect(() => {
    window.llmtrans.auth.current().then((current) => {
      if (!current) return;
      setAccountName(current.accountName);
      setNickname(current.nickname);
      setAuthenticated(true);
      loadConversations().catch((error) => setAppError(error.message));
    });
    window.llmtrans.conversations.status().then(setWorkerStatus);
    const removeStatus = window.llmtrans.onWorkerStatus(setWorkerStatus);
    const removeMessage = window.llmtrans.onMessage((message) => {
      setMessages((current) => {
        const bucket = current[message.conversationId] ?? [];
        if (bucket.some((item) => item.id === message.id)) return current;
        return {...current, [message.conversationId]: [...bucket, message]};
      });
      loadConversations().catch(() => {});
    });
    const removeError = window.llmtrans.onWorkerError((error) => setAppError(error.message));
    const removeFileChanged = window.llmtrans.onFileChanged((transfer) => {
      setFileTransfers((current) => {
        const bucket = current[transfer.conversationId] ?? [];
        const index = bucket.findIndex((item) => item.id === transfer.id);
        const next = index < 0
          ? [...bucket, transfer]
          : bucket.map((item) => item.id === transfer.id ? transfer : item);
        return {...current, [transfer.conversationId]: next};
      });
    });
    return () => {
      removeStatus();
      removeMessage();
      removeError();
      removeFileChanged();
    };
  }, []);

  useEffect(() => {
    if (authenticated && activeConversationId) {
      loadMessages(activeConversationId).catch((error) => setAppError(error.message));
      loadFileTransfers(activeConversationId).catch((error) => setAppError(error.message));
    }
  }, [authenticated, activeConversationId]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeChoice);
  }, [themeChoice]);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  }, [language]);

  return (
    <LanguageContext.Provider value={{
      language,
      toggleLanguage: () => setLanguage((current) => current === 'zh' ? 'en' : 'zh'),
    }}>
    <div className={`app-shell theme-${themeChoice.toLowerCase().replaceAll(' ', '-')}`} style={backgroundStyle}>
      <GlassFilter />
      <div className="ambient-grid" />
      {!authenticated ? (
        <AuthGate
          mode={authMode}
          onModeChange={setAuthMode}
          onAuthenticated={(nextAccount) => {
            setAccountName(nextAccount.accountName);
            setNickname(nextAccount.nickname);
            setAuthenticated(true);
            setAppError('');
            loadConversations().catch((error) => setAppError(error.message));
          }}
          backgroundUrl={backgroundUrl}
          onBackgroundChange={setBackgroundUrl}
          nickname={nickname}
          onNicknameChange={setNickname}
        />
      ) : (
        <>
          <TopNav
            page={page}
            onPageChange={setPage}
            nickname={nickname}
            onLogout={logout}
            themeChoice={themeChoice}
            onThemeToggle={() => setThemeChoice((current) => current === 'Light' ? 'Dark Glass' : 'Light')}
          />
          {page === 'project' && <ProjectPage onOpenChat={() => setPage('chat')} />}
          {page === 'chat' && (
            <ChatPage
              aiProvider={aiProvider}
              accountName={accountName}
              nickname={nickname}
              avatarUrl={avatarUrl}
              conversations={conversations}
              activeConversation={activeConversation}
              messages={activeConversation ? messages[activeConversation.id] ?? [] : []}
              fileTransfers={activeConversation ? fileTransfers[activeConversation.id] ?? [] : []}
              workerStatus={workerStatus}
              error={appError}
              onConversationSelect={(id) => {
                setActiveConversationId(id);
                setConversations((items) => items.map((item) => (item.id === id ? {...item, unread: 0} : item)));
              }}
              onCreateConversation={async (draft) => {
                try {
                  const next = await window.llmtrans.conversations.create({
                    name: draft.name,
                    cookiePath: draft.cookieFile,
                    dialoguePath: draft.dialogFile,
                  });
                  await loadConversations();
                  setActiveConversationId(next.id);
                  setAppError('');
                } catch (error) {
                  setAppError(error instanceof Error ? error.message : String(error));
                }
              }}
              onStart={async () => {
                if (!activeConversation) return;
                try {
                  setAppError('');
                  setWorkerStatus(await window.llmtrans.conversations.start(activeConversation.id));
                } catch (error) {
                  setAppError(error instanceof Error ? error.message : String(error));
                }
              }}
              onStop={async () => setWorkerStatus(await window.llmtrans.conversations.stop())}
              onSend={async (text) => {
                if (!activeConversation) return;
                try {
                  const outgoing = await window.llmtrans.messages.send(activeConversation.id, text);
                  setMessages((current) => ({
                    ...current,
                    [activeConversation.id]: [...(current[activeConversation.id] ?? []), outgoing],
                  }));
                  await loadConversations();
                  setAppError('');
                } catch (error) {
                  setAppError(error instanceof Error ? error.message : String(error));
                }
              }}
              onSendFile={async () => {
                if (!activeConversation) return;
                try {
                  const filePath = await window.llmtrans.files.chooseSend();
                  if (!filePath) return;
                  const transfer = await window.llmtrans.files.send(activeConversation.id, filePath);
                  setFileTransfers((current) => ({
                    ...current,
                    [activeConversation.id]: [
                      ...(current[activeConversation.id] ?? []).filter((item) => item.id !== transfer.id),
                      transfer,
                    ],
                  }));
                  setAppError('');
                } catch (error) {
                  setAppError(error instanceof Error ? error.message : String(error));
                }
              }}
              onOpenFile={(filePath) => window.llmtrans.files.openLocation(filePath)}
            />
          )}
          {page === 'vpn' && <VpnPage connected={vpnConnected} onToggle={() => setVpnConnected((value) => !value)} mode={proxyMode} onModeChange={setProxyMode} />}
          {page === 'settings' && (
            <SettingsPage
              nickname={nickname}
              onNicknameChange={setNickname}
              avatarUrl={avatarUrl}
              onAvatarChange={setAvatarUrl}
              aiProvider={aiProvider}
              onAiProviderChange={setAiProvider}
              themeChoice={themeChoice}
              onThemeChoiceChange={setThemeChoice}
            />
          )}
          {page === 'about' && <AboutPage />}
        </>
      )}
    </div>
    </LanguageContext.Provider>
  );
}

function GlassFilter() {
  return (
    <svg className="glass-filter" aria-hidden="true">
      <defs>
        <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="17" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap" />
          <feDisplacementMap in="SourceGraphic" in2="softMap" scale="18" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

function LiquidGlass({children, className = '', strong = false}: {children: React.ReactNode; className?: string; strong?: boolean}) {
  return (
    <div className={`liquid-glass ${strong ? 'liquid-glass-strong' : ''} ${className}`}>
      <div className="liquid-glass-effect" />
      <div className="liquid-glass-tint" />
      <div className="liquid-glass-shine" />
      <div className="liquid-glass-content">{children}</div>
    </div>
  );
}

function AuthGate({
  mode,
  onModeChange,
  onAuthenticated,
  backgroundUrl,
  onBackgroundChange,
  nickname,
  onNicknameChange,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (account: Account) => void;
  backgroundUrl: string;
  onBackgroundChange: (url: string) => void;
  nickname: string;
  onNicknameChange: (name: string) => void;
}) {
  const {language, toggleLanguage, t} = useCopy();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const next = mode === 'register'
        ? await window.llmtrans.auth.register({accountName, nickname, password})
        : await window.llmtrans.auth.login({accountName, password});
      onAuthenticated(next);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page" style={backgroundUrl ? ({'--login-image': `url(${backgroundUrl})`} as React.CSSProperties) : undefined}>
      <div className="auth-image-layer" />
      <button className="auth-language-toggle" onClick={toggleLanguage} aria-label={t('切换为英文', 'Switch to Chinese')}>
        <Languages size={17} /> {language === 'zh' ? 'EN' : '中'}
      </button>
      <section className="auth-layout">
        <LiquidGlass className="auth-brand-panel" strong>
          <div className="brand-lockup" title="版权所有南开大学llmtrans团队">
            <div className="brand-icon"><MessageSquare size={25} /></div>
            <div>
              <div className="brand-title">llmtrans</div>
              <div className="eyebrow">{t('研究型桌面客户端', 'Research Desktop Client')}</div>
            </div>
          </div>
          <div className="auth-copy">
            <div className="eyebrow cyan">{t('本地身份入口', 'Local identity gateway')}</div>
            <h1>{t('登录后进入 llmtrans 工作空间。', 'Sign in before entering the llmtrans workspace.')}</h1>
            <p>{t('完成登录或注册本地身份后，即可使用项目介绍、对话通信、VPN、设置与团队页面。', 'Sign in or register a local identity to access the project, chat, VPN, settings, and team pages.')}</p>
          </div>
          <div className="auth-stats">
            <MiniStat label={t('模式', 'Mode')} value={t('桌面端', 'Desktop')} />
            <MiniStat label={t('定位', 'Scope')} value={t('学术研究', 'Academic')} />
            <MiniStat label={t('状态', 'Status')} value={t('就绪', 'Ready')} green />
          </div>
        </LiquidGlass>

        <LiquidGlass className="auth-form-panel" strong>
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => onModeChange('login')}>{t('登录', 'Login')}</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => onModeChange('register')}>{t('注册', 'Register')}</button>
          </div>
          <h2>{mode === 'login' ? t('欢迎回来', 'Welcome back') : t('创建本地身份', 'Create local profile')}</h2>
          <p className="muted">{mode === 'login' ? t('使用本地账户进入桌面工作空间。', 'Use your local profile to enter the desktop workspace.') : t('为 llmtrans 客户端注册一个本地身份。', 'Register a local identity for the llmtrans client.')}</p>
          <div className="auth-form">
            {mode === 'register' && (
              <div className="avatar-row">
                <AvatarPreview avatarUrl="" label={nickname} />
                <div>
                  <div className="field-label">{t('个人头像', 'Profile avatar')}</div>
                  <div className="muted small">{t('头像可在进入工作空间后于设置中上传。', 'Upload an avatar later in Settings.')}</div>
                </div>
              </div>
            )}
            <label>
              <span className="field-label">{mode === 'login' ? t('账户名', 'Account name') : t('昵称', 'Nickname')}</span>
              {mode === 'login'
                ? <input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder={t('例如：researcher-a', 'e.g. researcher-a')} />
                : <input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} placeholder={t('例如：研究员 A', 'e.g. Researcher A')} />}
            </label>
            {mode === 'register' && (
              <label>
                <span className="field-label">{t('账户名', 'Account name')}</span>
                <input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder={t('本地账户名', 'Local account name')} />
              </label>
            )}
            <label>
              <span className="field-label">{t('密码', 'Password')}</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder={t('请输入密码', 'Enter password')} />
            </label>
            {mode === 'register' && (
              <label>
                <span className="field-label">{t('确认密码', 'Confirm password')}</span>
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder={t('请再次输入密码', 'Confirm password')} />
              </label>
            )}
            <div className="background-picker">
              <div>
                <div className="field-label">{t('登录背景图片', 'Login background image')}</div>
                <div className="muted small">{t('可选，仅影响登录注册页面。', 'Optional. This affects only the login page.')}</div>
              </div>
              <button onClick={() => fileRef.current?.click()}><FolderOpen size={16} /> {t('选择', 'Choose')}</button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onBackgroundChange(URL.createObjectURL(file));
                }}
              />
            </div>
            {error && <div className="auth-notice error-notice"><Info size={16} /> {error}</div>}
            <button className="primary-action" disabled={submitting} onClick={submit}>
              {submitting ? t('请稍候...', 'Please wait...') : mode === 'login' ? t('进入 llmtrans', 'Enter llmtrans') : t('创建并进入', 'Create and enter')}
            </button>
          </div>
        </LiquidGlass>
      </section>
    </main>
  );
}

function TopNav({
  page,
  onPageChange,
  nickname,
  onLogout,
  themeChoice,
  onThemeToggle,
}: {
  page: Page;
  onPageChange: (page: Page) => void;
  nickname: string;
  onLogout: () => Promise<void>;
  themeChoice: ThemeChoice;
  onThemeToggle: () => void;
}) {
  const {language, toggleLanguage, t} = useCopy();
  const nav: Array<{id: Page; label: string}> = [
    {id: 'project', label: t('项目', 'Project')},
    {id: 'chat', label: t('对话', 'Chat')},
    {id: 'vpn', label: 'VPN'},
    {id: 'settings', label: t('设置', 'Settings')},
    {id: 'about', label: t('团队', 'Team')},
  ];
  return (
    <nav className="top-nav">
      <div className="nav-left">
        <div className="brand-lockup compact" title="版权所有南开大学llmtrans团队">
          <div className="brand-icon"><MessageSquare size={20} /></div>
          <div className="brand-title">llmtrans</div>
        </div>
        <div className="nav-links">
          {nav.map((item) => (
            <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => onPageChange(item.id)}>{item.label}</button>
          ))}
        </div>
      </div>
      <div className="nav-actions">
        <button className="language-toggle" onClick={toggleLanguage} title={t('切换为英文', 'Switch to Chinese')}>
          <Languages size={17} /> {language === 'zh' ? 'EN' : '中'}
        </button>
        <button
          className="icon-button theme-toggle"
          title={themeChoice === 'Light' ? t('切换为暗色模式', 'Switch to dark mode') : t('切换为亮色模式', 'Switch to light mode')}
          aria-label={themeChoice === 'Light' ? t('切换为暗色模式', 'Switch to dark mode') : t('切换为亮色模式', 'Switch to light mode')}
          onClick={onThemeToggle}
        >
          {themeChoice === 'Light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button className="icon-button"><UserCircle size={20} /></button>
        <button className="icon-button"><CircleHelp size={20} /></button>
        <button className="icon-button" title={t('退出登录', 'Log out')} aria-label={t('退出登录', 'Log out')} onClick={onLogout}><LogOut size={20} /></button>
        <div className="nav-user">{nickname.slice(0, 1).toUpperCase()}</div>
      </div>
    </nav>
  );
}

function ProjectPage({onOpenChat}: {onOpenChat: () => void}) {
  const {t} = useCopy();
  return (
    <PageFrame>
      <header className="page-header">
        <div className="eyebrow cyan">{t('llmtrans 项目中心', 'llmtrans Project Hub')}</div>
        <h1>{t('面向 AI 中介通信研究的桌面对话客户端。', 'A desktop chat client for experimental AI-mediated communication research.')}</h1>
        <p>{t('通过统一的桌面工作空间组织共享对话、身份信息与通信流程，让研究团队能够更直观地观察和体验跨端交流。', 'A unified desktop workspace for shared conversations, identity information, and communication workflows across multiple clients.')}</p>
      </header>
      <div className="project-grid">
        <LiquidGlass className="project-feature">
          <MessageSquare />
          <h2>{t('共享对话通道', 'Shared Conversation Channel')}</h2>
          <p>{t('多个本地客户端可以围绕同一会话进行交流，同时保留清晰、熟悉的即时通信体验。', 'Multiple local clients can communicate through one shared conversation while retaining a clear, familiar chat experience.')}</p>
        </LiquidGlass>
        <LiquidGlass className="project-feature">
          <Shield />
          <h2>{t('本地身份标识', 'Local Identity')}</h2>
          <p>{t('每位参与者都拥有独立的本地身份与昵称，使不同窗口和设备中的消息来源保持清晰可辨。', 'Each participant has an independent local identity and nickname so message ownership remains clear across windows and devices.')}</p>
        </LiquidGlass>
        <LiquidGlass className="project-feature wide">
          <Plug />
          <h2>{t('桌面客户端流程', 'Desktop Client Workflow')}</h2>
          <div className="workflow">
            <WorkflowStep label={t('桌面界面', 'Desktop UI')} icon={<MessageSquare size={18} />} />
            <WorkflowStep label={t('本地连接', 'Local Bridge')} icon={<Route size={18} />} />
            <WorkflowStep label={t('通信服务', 'Communication Service')} icon={<Bot size={18} />} />
            <WorkflowStep label={t('共享 AI 对话', 'Shared AI Conversation')} icon={<Sparkles size={18} />} />
          </div>
        </LiquidGlass>
        <LiquidGlass className="status-card" strong>
          <h2>{t('系统状态', 'System Status')}</h2>
          <StatusRow label={t('核心通信服务', 'Core Communication Service')} value={t('在线', 'ONLINE')} />
          <StatusRow label={t('本地连接服务', 'Local Bridge Service')} value={t('就绪', 'READY')} />
          <StatusRow label={t('桌面工作空间', 'Desktop Workspace')} value={t('可用', 'ACTIVE')} />
          <button className="primary-action inline" onClick={onOpenChat}>{t('打开对话工作台', 'Open Chat Workspace')}</button>
        </LiquidGlass>
      </div>
    </PageFrame>
  );
}

function ChatPage({
  conversations,
  activeConversation,
  messages,
  fileTransfers,
  accountName,
  nickname,
  avatarUrl,
  aiProvider,
  workerStatus,
  error,
  onConversationSelect,
  onCreateConversation,
  onStart,
  onStop,
  onSend,
  onSendFile,
  onOpenFile,
}: {
  conversations: Conversation[];
  activeConversation?: Conversation;
  messages: ChatMessage[];
  fileTransfers: ElectronFileTransfer[];
  accountName: string;
  nickname: string;
  avatarUrl: string;
  aiProvider: AiProvider;
  workerStatus: WorkerStatus;
  error: string;
  onConversationSelect: (id: string) => void;
  onCreateConversation: (draft: {name: string; cookieFile: string; dialogFile: string}) => Promise<void>;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onSend: (text: string) => Promise<void>;
  onSendFile: () => Promise<void>;
  onOpenFile: (filePath: string) => Promise<boolean>;
}) {
  const {t} = useCopy();
  const [draft, setDraft] = useState('');
  const [conversationName, setConversationName] = useState('');
  const [cookieFile, setCookieFile] = useState('');
  const [dialogFile, setDialogFile] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isCurrentRunning = workerStatus.status === 'running' && workerStatus.conversationId === activeConversation?.id;
  const isCurrentStarting = workerStatus.status === 'starting' && workerStatus.conversationId === activeConversation?.id;
  const areFileWorkersRunning = isCurrentRunning && workerStatus.fileSenderRunning && workerStatus.fileReceiverRunning;

  useEffect(() => {
    scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight, behavior: 'smooth'});
  }, [messages, fileTransfers, activeConversation?.id]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !isCurrentRunning) return;
    await onSend(text);
    setDraft('');
  };

  return (
    <main className="chat-shell">
      <aside className="chat-sidebar">
        <LiquidGlass className="conversation-create" strong>
          <div className="sidebar-title-row">
            <div>
              <h2>{t('会话', 'Conversations')}</h2>
              <p>{t('使用本地文件创建通信会话。', 'Create a channel from local files.')}</p>
            </div>
            <button className="round-add" onClick={() => onCreateConversation({name: conversationName, cookieFile, dialogFile})}>+</button>
          </div>
          <button className="file-chip" onClick={async () => {
            const selected = await window.llmtrans.files.chooseCookie();
            if (selected) setCookieFile(selected);
          }}><Cookie size={16} /><span><b>{t('Cookie 文件', 'Cookies file')}</b>{cookieFile || t('未选择', 'Not selected')}</span></button>
          <button className="file-chip" onClick={async () => {
            const selected = await window.llmtrans.files.chooseDialogue();
            if (selected) setDialogFile(selected);
          }}><FileText size={16} /><span><b>{t('对话文件', 'Conversation file')}</b>{dialogFile || t('未选择', 'Not selected')}</span></button>
          <input value={conversationName} onChange={(event) => setConversationName(event.target.value)} placeholder={t('会话名称', 'Conversation name')} />
          <button className="primary-action small" onClick={() => onCreateConversation({name: conversationName, cookieFile, dialogFile})}>{t('创建会话', 'Create Conversation')}</button>
        </LiquidGlass>
        <div className="conversation-list">
          <div className="section-label">{t('会话列表', 'Conversation List')}</div>
          {conversations.map((item) => (
            <button key={item.id} className={`conversation-item ${item.id === activeConversation?.id ? 'active' : ''}`} onClick={() => onConversationSelect(item.id)}>
              <div className="conversation-avatar">{item.name.slice(0, 1).toUpperCase()}</div>
              <div className="conversation-main">
                <div className="conversation-row"><b>{item.name}</b><span>{item.time}</span></div>
                <div className="conversation-preview">{item.lastMessage}</div>
              </div>
              {item.unread > 0 && <span className="unread">{item.unread}</span>}
            </button>
          ))}
        </div>
        <LiquidGlass className="local-profile">
          <AvatarPreview avatarUrl={avatarUrl} label={nickname} />
          <div><b>{nickname}</b><span>{t('本地用户', 'Local user')}</span></div>
          <Settings size={18} />
        </LiquidGlass>
      </aside>

      <section className="chat-main">
        <header className="chat-header">
          <div>
            <h1>{activeConversation?.name ?? t('请选择或创建一个会话', 'Select or create a conversation')}</h1>
            <div className={`online-line ${isCurrentRunning ? '' : 'offline'}`}><span /> {
              isCurrentRunning ? t('运行中', 'Running') : isCurrentStarting ? t('正在启动通信服务...', 'Starting communication service...') : t('未运行', 'Not running')
            }</div>
          </div>
          <div className="chat-header-actions">
            <button className="glass-button">AI: {aiProvider}</button>
            {isCurrentRunning || isCurrentStarting
              ? <button className="glass-button" onClick={onStop}><Power size={16} /> {t('停止', 'Stop')}</button>
              : <button className="primary-action inline" disabled={!activeConversation} onClick={onStart}><Power size={16} /> {t('启动', 'Start')}</button>}
            <button className="icon-button"><MoreHorizontal size={20} /></button>
          </div>
        </header>
        {error && <div className="chat-error"><Info size={16} /> {error}</div>}
        <div ref={scrollRef} className="message-list">
          {messages.map((item) => <MessageBubble key={item.id} message={item} accountName={accountName} nickname={nickname} avatarUrl={avatarUrl} />)}
          {fileTransfers.map((transfer) => (
            <FileTransferBubble
              key={transfer.id}
              transfer={transfer}
              onOpen={() => onOpenFile(transfer.filePath)}
            />
          ))}
          {!activeConversation && <div className="system-message">{t('请选择 Cookie 文件与对话文件来创建会话。', 'Create a conversation by selecting a Cookie file and a dialogue file.')}</div>}
        </div>
        <footer className="composer-wrap">
          <LiquidGlass className="composer" strong>
            <button
              className="icon-button"
              disabled={!areFileWorkersRunning}
              title={areFileWorkersRunning ? t('发送文件', 'Send file') : t('启动会话后发送文件', 'Start the conversation before sending files')}
              aria-label={t('发送文件', 'Send file')}
              onClick={onSendFile}
            >
              <Paperclip size={20} />
            </button>
            <textarea disabled={!isCurrentRunning} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }} placeholder={isCurrentRunning ? t('输入消息...', 'Type a message...') : t('请先启动当前会话', 'Start this conversation before sending')} rows={1} />
            <button className="send-button" disabled={!isCurrentRunning} onClick={send}><Send size={18} /></button>
          </LiquidGlass>
        </footer>
      </section>
    </main>
  );
}

function VpnPage({connected, onToggle, mode, onModeChange}: {connected: boolean; onToggle: () => void; mode: ProxyMode; onModeChange: (mode: ProxyMode) => void}) {
  const {t} = useCopy();
  const modeLabel = (item: ProxyMode) => ({
    Global: t('全局', 'Global'),
    'Rule-based': t('规则模式', 'Rule-based'),
    Direct: t('直连', 'Direct'),
    'Research Tunnel': t('研究通道', 'Research Tunnel'),
  })[item];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const download = connected ? (94 + Math.sin(tick / 2) * 16).toFixed(1) : '0.0';
  const upload = connected ? (12 + Math.cos(tick / 3) * 3).toFixed(1) : '0.0';

  return (
    <PageFrame>
      <section className="vpn-console">
        <div className="power-zone">
          <button className={`power-button ${connected ? 'connected' : ''}`} onClick={onToggle}>
            <span className="pulse-ring" />
            <span className="pulse-ring delay" />
            <Power size={66} />
          </button>
          <h1>{connected ? t('已保护', 'Protected') : t('未连接', 'Disconnected')}</h1>
          <p><span className={connected ? 'green-dot' : 'red-dot'} /> {connected ? t('已连接至 Zurich, CH-01', 'Connected to Zurich, CH-01') : t('网络通道已离线', 'Tunnel is offline')}</p>
        </div>
        <div className="metric-grid">
          <Metric icon={<ArrowUp />} label={t('上传', 'Upload')} value={`${upload} MB/s`} />
          <Metric icon={<ArrowDown />} label={t('下载', 'Download')} value={`${download} MB/s`} />
          <Metric icon={<Activity />} label={t('总流量', 'Total Traffic')} value={connected ? `${(4.2 + tick * 0.01).toFixed(2)} GB` : '0 GB'} />
          <Metric icon={<Gauge />} label={t('持续时间', 'Duration')} value={connected ? `04:${String(12 + Math.floor(tick / 60)).padStart(2, '0')}:${String(tick % 60).padStart(2, '0')}` : '00:00:00'} mono />
        </div>
      </section>
      <div className="vpn-grid">
        <LiquidGlass className="route-panel">
          <h2><Route size={21} /> {t('路由模式', 'Routing Mode')}</h2>
          {(['Global', 'Rule-based', 'Direct', 'Research Tunnel'] as ProxyMode[]).map((item) => (
            <button key={item} className={mode === item ? 'selected' : ''} onClick={() => onModeChange(item)}>
              <span>{modeLabel(item)}</span>
              {mode === item && <CheckCircle2 size={18} />}
            </button>
          ))}
        </LiquidGlass>
        <LiquidGlass className="node-panel">
          <div className="panel-head"><h2>{t('节点选择', 'Node Selection')}</h2><div className="search-box"><Search size={16} /><input placeholder={t('筛选节点...', 'Filter nodes...')} /></div></div>
          <div className="nodes">
            <Node active flag="CH" name="Zurich, CH-01" latency="12ms" meta="Research Net / Secure" />
            <Node flag="US" name="New York, US-04" latency="84ms" meta="Global / High Speed" />
            <Node flag="JP" name="Tokyo, JP-02" latency="115ms" meta="Global / High Speed" />
            <Node offline flag="UK" name="London, UK-01" latency="999ms" meta="Offline" />
          </div>
        </LiquidGlass>
      </div>
    </PageFrame>
  );
}

function SettingsPage({
  nickname,
  onNicknameChange,
  avatarUrl,
  onAvatarChange,
  aiProvider,
  onAiProviderChange,
  themeChoice,
  onThemeChoiceChange,
}: {
  nickname: string;
  onNicknameChange: (name: string) => void;
  avatarUrl: string;
  onAvatarChange: (url: string) => void;
  aiProvider: AiProvider;
  onAiProviderChange: (provider: AiProvider) => void;
  themeChoice: ThemeChoice;
  onThemeChoiceChange: (theme: ThemeChoice) => void;
}) {
  const {t} = useCopy();
  const themeLabel = (theme: ThemeChoice) => ({
    'Dark Glass': t('暗色玻璃', 'Dark Glass'),
    Light: t('亮色', 'Light'),
    'High Contrast': t('高对比度', 'High Contrast'),
    'Blue Research': t('研究蓝', 'Blue Research'),
  })[theme];
  const avatarInput = useRef<HTMLInputElement | null>(null);
  return (
    <PageFrame>
      <header className="page-header compact">
        <div className="eyebrow cyan">{t('工作空间偏好', 'Workspace Preferences')}</div>
        <h1>{t('设置', 'Settings')}</h1>
        <p>{t('管理本地身份、界面外观、通信 AI 与文件默认位置。', 'Manage your local profile, interface style, communication AI, and file defaults.')}</p>
      </header>
      <div className="settings-grid">
        <LiquidGlass className="profile-card" strong>
          <button className="avatar-edit" onClick={() => avatarInput.current?.click()}>
            <AvatarPreview avatarUrl={avatarUrl} label={nickname} large />
            <span><Camera size={18} /></span>
          </button>
          <input ref={avatarInput} hidden type="file" accept="image/*" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onAvatarChange(URL.createObjectURL(file));
          }} />
          <h2>{nickname}</h2>
          <p>{t('本地研究身份', 'Local research identity')}</p>
          <label><span className="field-label">{t('昵称', 'Nickname')}</span><input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} /></label>
          <label><span className="field-label">{t('本地用户 ID', 'Local User ID')}</span><div className="copy-field"><input readOnly value="SM-LOCAL-8492-X" /><button><Copy size={16} /></button></div></label>
        </LiquidGlass>
        <div className="settings-panels">
          <LiquidGlass className="settings-section">
            <h2><Bot size={21} /> {t('通信 AI', 'Communication AI')}</h2>
            <div className="choice-grid three">
              {(['Doubao', 'Other AI', 'Custom Provider'] as AiProvider[]).map((provider) => (
                <button key={provider} className={aiProvider === provider ? 'selected' : ''} onClick={() => onAiProviderChange(provider)}>
                  <b>{provider}</b><span>{provider === 'Doubao' ? t('当前通道', 'Current channel') : t('待接入', 'Placeholder')}</span>
                </button>
              ))}
            </div>
          </LiquidGlass>
          <LiquidGlass className="settings-section">
            <h2><Palette size={21} /> {t('外观', 'Appearance')}</h2>
            <div className="theme-grid">
              {(['Dark Glass', 'Light', 'High Contrast', 'Blue Research'] as ThemeChoice[]).map((theme) => (
                <button key={theme} className={themeChoice === theme ? 'selected' : ''} onClick={() => onThemeChoiceChange(theme)}>
                  <span className={`theme-swatch swatch-${theme.toLowerCase().replaceAll(' ', '-')}`} />
                  <b>{themeLabel(theme)}</b>
                </button>
              ))}
            </div>
          </LiquidGlass>
          <div className="split-panels">
            <LiquidGlass className="settings-section">
              <h2><MessageSquare size={21} /> {t('消息行为', 'Message Behavior')}</h2>
              <ToggleRow title={t('轮询间隔', 'Polling interval')} detail={t('当前为 1 秒间隔', 'Current 1 second interval')} control={<select><option>{t('1 秒', '1 second')}</option><option>{t('3 秒', '3 seconds')}</option></select>} />
              <ToggleRow title={t('显示回传消息', 'Show echoed messages')} detail={t('保留已确认的本人消息。', 'Keep self-confirmed messages visible.')} enabled />
              <ToggleRow title={t('保存本地历史', 'Save local history')} detail={t('在此设备上保留消息记录。', 'Persist messages on this device.')} enabled />
            </LiquidGlass>
            <LiquidGlass className="settings-section">
              <h2><FolderOpen size={21} /> {t('文件存储', 'File Storage')}</h2>
              <label><span className="field-label">{t('Cookie 文件夹', 'Cookies folder')}</span><input value="Core_Architecture/cookies" readOnly /></label>
              <label><span className="field-label">{t('对话文件夹', 'Conversation folder')}</span><input value="Core_Architecture/test" readOnly /></label>
              <label><span className="field-label">{t('日志文件夹', 'Log folder')}</span><input value="logs/llmtrans" readOnly /></label>
            </LiquidGlass>
          </div>
          <div className="settings-actions"><button className="secondary-action">{t('取消', 'Cancel')}</button><button className="primary-action inline"><Save size={17} /> {t('保存偏好', 'Save Preferences')}</button></div>
        </div>
      </div>
    </PageFrame>
  );
}

function AboutPage() {
  const {t} = useCopy();
  return (
    <PageFrame>
      <header className="page-header compact">
        <div className="eyebrow cyan">{t('关于 llmtrans', 'About llmtrans')}</div>
        <h1>{t('认识 llmtrans 背后的研究团队。', 'Meet the research team behind llmtrans.')}</h1>
        <p>{t('项目由南开大学教师与学生成员共同推进，团队关注基于 AI 应用与多模态构建的加密通信通道，以及产品在真实交流场景中的可理解性与使用体验。', 'Jointly developed by Nankai University teachers and students, the team studies encrypted communication channels based on AI applications and multimodal modeling, with close attention to real-world usability.')}</p>
      </header>
      <div className="about-grid">
        <LiquidGlass className="research-card">
          <h2><Sparkles size={22} /> {t('研究方向', 'Research Direction')}</h2>
          <p>{t('llmtrans 希望为不同参与者提供清晰、自然且可持续使用的交流空间，让跨端身份、共享会话与 AI 中介通信以更容易理解的方式呈现在用户面前。', 'llmtrans explores a clear and approachable communication space where cross-device identity, shared conversations, and AI-mediated communication can be understood and used naturally.')}</p>
          <p>{t('团队不仅关注产品能否运行，也关注人们能否理解它、信任它，并愿意在长期交流中持续使用。我们通过原型设计、交流实验与体验观察，逐步明确产品的边界与价值。', 'We study not only whether a product works, but whether people can understand it, trust it, and feel comfortable using it over time. Prototypes, communication experiments, and experience observation guide the product direction.')}</p>
        </LiquidGlass>
        <LiquidGlass className="affiliation-card">
          <h2>{t('团队归属', 'Affiliation')}</h2>
          <div className="affiliation-line"><Shield /><div><b>{t('南开大学', 'Nankai University')}</b><span>{t('密码与网络空间安全学院', 'College of Cyber Science')}</span></div></div>
          <MiniStat label={t('成员', 'Team')} value={t('3 人', '3 people')} />
          <MiniStat label={t('用途', 'Use')} value={t('学术研究', 'Academic')} />
        </LiquidGlass>
      </div>
      <section className="team-section">
        <h2><Users size={22} /> {t('核心团队', 'Core Team')}</h2>
        <div className="team-grid">
          <TeamCard image="./team/teacher.jpg" role={t('指导教师 / 项目负责人', 'Teacher / Project Supervisor')} name={t('李想', 'Li Xiang')} contribution={t('南开大学密码与网络空间安全学院副教授，负责研究方向、学术边界与整体架构评审，推动实验目标与产品表达保持一致。', 'Associate Professor at Nankai University. Guides the research direction, academic scope, and overall project review while keeping experimental goals aligned with the product vision.')} />
          <TeamCard image="./team/student1.jpg" role={t('学生开发者 / 桌面端', 'Student Developer / Desktop')} name={t('吴宇轩（Siamese）', 'Yuxuan Wu (Siamese)')} contribution={t('南开大学信息安全专业本科生，负责桌面交互界面、本地身份体验与消息工作流，让研究概念能够转化为清晰可用的产品界面。', 'Information Security undergraduate at Nankai University, responsible for the desktop experience, local identity interaction, and message workflow that turn research concepts into an approachable product.')} />
          <TeamCard image="./team/student2.jpg" role={t('学生开发者 / 通信核心', 'Student Developer / Communication')} name={t('石昊洋（商鞅）', 'Haoyang Shi (Shang Yang)')} contribution={t('南开大学信息安全专业本科生，负责通信体验验证、产品交付、文档整理与演示呈现，让研究成果更容易被理解、体验与传播。', 'Information Security undergraduate at Nankai University, focused on communication experience validation, product delivery, documentation, and presentation of the research outcomes.')} />
        </div>
      </section>
      <footer className="about-footer">{t('© 2026 南开大学 · LLMTRANS 团队 · 学术研究', '© 2026 Nankai University · LLMTRANS Team · Academic Research')}</footer>
    </PageFrame>
  );
}

function PageFrame({children}: {children: React.ReactNode}) {
  return <main className="page-frame">{children}</main>;
}

function AvatarPreview({avatarUrl, label, large = false}: {avatarUrl: string; label: string; large?: boolean}) {
  return <div className={`avatar ${large ? 'large' : ''}`}>{avatarUrl ? <img src={avatarUrl} alt={label} /> : <span>{label.slice(0, 1).toUpperCase()}</span>}</div>;
}

function MiniStat({label, value, green = false}: {label: string; value: string; green?: boolean}) {
  return <div className="mini-stat"><span>{label}</span><b className={green ? 'green-text' : ''}>{value}</b></div>;
}

function WorkflowStep({label, icon}: {label: string; icon: React.ReactNode}) {
  return <div className="workflow-step">{icon}<span>{label}</span></div>;
}

function StatusRow({label, value}: {label: string; value: string}) {
  return <div className="status-row"><span>{label}</span><b><i /> {value}</b></div>;
}

function MessageBubble({
  message,
  accountName,
  nickname,
  avatarUrl,
}: {
  message: ChatMessage;
  accountName: string;
  nickname: string;
  avatarUrl: string;
}) {
  if (message.origin === 'system') return <div className="system-message">{message.text}</div>;
  const self = message.senderAccount.localeCompare(accountName, undefined, {sensitivity: 'accent'}) === 0;
  return (
    <div className={`message-row ${self ? 'self' : ''}`}>
      {!self && <div className="peer-avatar">{message.sender.slice(0, 1)}</div>}
      <div>
        <div className="message-meta">{self ? nickname : message.sender} · {message.time}</div>
        <div className={`message-bubble ${self ? 'self' : ''}`}>{message.text}</div>
      </div>
      {self && <AvatarPreview avatarUrl={avatarUrl} label={nickname} />}
    </div>
  );
}

function FileTransferBubble({
  transfer,
  onOpen,
}: {
  transfer: ElectronFileTransfer;
  onOpen: () => Promise<boolean>;
}) {
  const {t} = useCopy();
  const self = transfer.direction === 'self';
  const status = {
    sending: t('发送中', 'Sending'),
    sent: t('已发送', 'Sent'),
    received: t('已接收', 'Received'),
    error: t('发送失败', 'Failed'),
  }[transfer.status];
  return (
    <div className={`file-transfer-row ${self ? 'self' : ''}`}>
      <button
        className={`file-transfer-card ${transfer.status}`}
        disabled={transfer.status !== 'received'}
        onClick={onOpen}
      >
        <span className="file-transfer-icon"><FileText size={22} /></span>
        <span className="file-transfer-copy">
          <b>{transfer.fileName}</b>
          <small>{status} · {transfer.time}</small>
          {transfer.errorMessage && <em>{transfer.errorMessage}</em>}
        </span>
        {transfer.status === 'received' && <FolderOpen size={17} />}
      </button>
    </div>
  );
}

function Metric({icon, label, value, mono = false}: {icon: React.ReactNode; label: string; value: string; mono?: boolean}) {
  return <LiquidGlass className="metric-card">{icon}<span>{label}</span><b className={mono ? 'mono' : ''}>{value}</b></LiquidGlass>;
}

function Node({flag, name, latency, meta, active = false, offline = false}: {flag: string; name: string; latency: string; meta: string; active?: boolean; offline?: boolean}) {
  return <button className={`node-card ${active ? 'active' : ''} ${offline ? 'offline' : ''}`}><span>{flag}</span><div><b>{name}</b><small>{meta}</small></div><em>{latency}</em></button>;
}

function ToggleRow({title, detail, enabled, control}: {title: string; detail: string; enabled?: boolean; control?: React.ReactNode}) {
  return <div className="toggle-row"><div><b>{title}</b><span>{detail}</span></div>{control ?? <button className={`toggle ${enabled ? 'enabled' : ''}`}><span /></button>}</div>;
}

function TeamCard({image, role, name, contribution}: {image: string; role: string; name: string; contribution: string}) {
  return <LiquidGlass className="team-card"><img className="team-avatar" src={image} alt={name} /><div className="team-card-copy"><h3>{name}</h3><b>{role}</b><p>{contribution}</p></div></LiquidGlass>;
}
