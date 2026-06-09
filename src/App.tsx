import React, {useEffect, useMemo, useRef, useState} from 'react';
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
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react';

type Page = 'project' | 'chat' | 'vpn' | 'settings' | 'about';
type AuthMode = 'login' | 'register';
type ThemeChoice = 'Dark Glass' | 'Light' | 'High Contrast' | 'Blue Research';
type ProxyMode = 'Global' | 'Rule-based' | 'Direct' | 'Research Tunnel';
type AiProvider = 'Doubao' | 'Other AI' | 'Custom Provider';
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
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>('Dark Glass');
  const [aiProvider, setAiProvider] = useState<AiProvider>('Doubao');
  const [proxyMode, setProxyMode] = useState<ProxyMode>('Rule-based');
  const [vpnConnected, setVpnConnected] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({
    status: 'stopped',
    conversationId: null,
    senderRunning: false,
    receiverRunning: false,
  });
  const [appError, setAppError] = useState('');

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
      setWorkerStatus({
        status: 'stopped',
        conversationId: null,
        senderRunning: false,
        receiverRunning: false,
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
    return () => {
      removeStatus();
      removeMessage();
      removeError();
    };
  }, []);

  useEffect(() => {
    if (authenticated && activeConversationId) loadMessages(activeConversationId).catch((error) => setAppError(error.message));
  }, [authenticated, activeConversationId]);

  return (
    <div className={`app-shell theme-${themeChoice.toLowerCase().replaceAll(' ', '-')}`}>
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
          <TopNav page={page} onPageChange={setPage} nickname={nickname} onLogout={logout} />
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
      <section className="auth-layout">
        <LiquidGlass className="auth-brand-panel" strong>
          <div className="brand-lockup" title="版权所有南开大学llmtrans团队">
            <div className="brand-icon"><MessageSquare size={25} /></div>
            <div>
              <div className="brand-title">llmtrans</div>
              <div className="eyebrow">Research Desktop Client</div>
            </div>
          </div>
          <div className="auth-copy">
            <div className="eyebrow cyan">Local identity gateway</div>
            <h1>Sign in before entering the workspace.</h1>
            <p>The project, chat, VPN, settings, and about pages are available only after login or local profile registration.</p>
          </div>
          <div className="auth-stats">
            <MiniStat label="Mode" value="Desktop" />
            <MiniStat label="Scope" value="Academic" />
            <MiniStat label="Status" value="Ready" green />
          </div>
        </LiquidGlass>

        <LiquidGlass className="auth-form-panel" strong>
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => onModeChange('login')}>Login</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => onModeChange('register')}>Register</button>
          </div>
          <h2>{mode === 'login' ? 'Welcome back' : 'Create local profile'}</h2>
          <p className="muted">{mode === 'login' ? 'Use your local profile to enter the desktop workspace.' : 'Register a local identity for this demo client.'}</p>
          <div className="auth-form">
            {mode === 'register' && (
              <div className="avatar-row">
                <AvatarPreview avatarUrl="" label={nickname} />
                <div>
                  <div className="field-label">Profile avatar</div>
                  <div className="muted small">Avatar upload is configured later in Settings.</div>
                </div>
              </div>
            )}
            <label>
              <span className="field-label">{mode === 'login' ? 'Account name' : 'Nickname'}</span>
              {mode === 'login'
                ? <input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="e.g. researcher-a" />
                : <input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} placeholder="e.g. Researcher A" />}
            </label>
            {mode === 'register' && (
              <label>
                <span className="field-label">Account name</span>
                <input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="Local account name" />
              </label>
            )}
            <label>
              <span className="field-label">Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Enter password" />
            </label>
            {mode === 'register' && (
              <label>
                <span className="field-label">Confirm password</span>
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="Confirm password" />
              </label>
            )}
            <div className="background-picker">
              <div>
                <div className="field-label">Login background image</div>
                <div className="muted small">Optional. This affects only the login page.</div>
              </div>
              <button onClick={() => fileRef.current?.click()}><FolderOpen size={16} /> Choose</button>
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
              {submitting ? 'Please wait...' : mode === 'login' ? 'Enter llmtrans' : 'Create and enter'}
            </button>
          </div>
          <div className="auth-notice"><Info size={16} /> Academic research prototype. This login gate is part of the desktop UI demo.</div>
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
}: {
  page: Page;
  onPageChange: (page: Page) => void;
  nickname: string;
  onLogout: () => Promise<void>;
}) {
  const nav: Array<{id: Page; label: string}> = [
    {id: 'project', label: 'Project'},
    {id: 'chat', label: 'Chat'},
    {id: 'vpn', label: 'VPN'},
    {id: 'settings', label: 'Settings'},
    {id: 'about', label: 'About'},
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
        <button className="icon-button"><UserCircle size={20} /></button>
        <button className="icon-button"><CircleHelp size={20} /></button>
        <button className="icon-button" title="Log out" aria-label="Log out" onClick={onLogout}><LogOut size={20} /></button>
        <div className="nav-user">{nickname.slice(0, 1).toUpperCase()}</div>
      </div>
    </nav>
  );
}

function ProjectPage({onOpenChat}: {onOpenChat: () => void}) {
  return (
    <PageFrame>
      <header className="page-header">
        <div className="eyebrow cyan">llmtrans Project Hub</div>
        <h1>A desktop chat client for experimental AI-mediated communication research.</h1>
        <p>Designed as a local research console with shared conversation channels, identity protocol metadata, and desktop-first workflows.</p>
      </header>
      <div className="project-grid">
        <LiquidGlass className="project-feature">
          <MessageSquare />
          <h2>Shared Conversation Channel</h2>
          <p>Multiple local clients use the same AI conversation as a message relay while the UI presents a conventional chat experience.</p>
        </LiquidGlass>
        <LiquidGlass className="project-feature">
          <Shield />
          <h2>Local Identity Protocol</h2>
          <p>Each desktop client attaches a local sender ID, message ID, nickname, and timestamp before sending through the channel.</p>
        </LiquidGlass>
        <LiquidGlass className="project-feature wide">
          <Plug />
          <h2>Desktop Client Workflow</h2>
          <div className="workflow">
            <WorkflowStep label="Desktop UI" icon={<MessageSquare size={18} />} />
            <WorkflowStep label="Local Bridge" icon={<Route size={18} />} />
            <WorkflowStep label="Python Workers" icon={<Bot size={18} />} />
            <WorkflowStep label="Shared AI Conversation" icon={<Sparkles size={18} />} />
          </div>
        </LiquidGlass>
        <LiquidGlass className="status-card" strong>
          <h2>System Status</h2>
          <StatusRow label="Core Routing Engine" value="ONLINE" />
          <StatusRow label="Local Bridge Workers" value="DEMO" />
          <StatusRow label="UI Prototype" value="ACTIVE" />
          <button className="primary-action inline" onClick={onOpenChat}>Open Chat Workspace</button>
        </LiquidGlass>
      </div>
    </PageFrame>
  );
}

function ChatPage({
  conversations,
  activeConversation,
  messages,
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
}: {
  conversations: Conversation[];
  activeConversation?: Conversation;
  messages: ChatMessage[];
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
}) {
  const [draft, setDraft] = useState('');
  const [conversationName, setConversationName] = useState('');
  const [cookieFile, setCookieFile] = useState('');
  const [dialogFile, setDialogFile] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isCurrentRunning = workerStatus.status === 'running' && workerStatus.conversationId === activeConversation?.id;
  const isCurrentStarting = workerStatus.status === 'starting' && workerStatus.conversationId === activeConversation?.id;

  useEffect(() => {
    scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight, behavior: 'smooth'});
  }, [messages, activeConversation?.id]);

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
              <h2>Conversations</h2>
              <p>Create a channel from local files.</p>
            </div>
            <button className="round-add" onClick={() => onCreateConversation({name: conversationName, cookieFile, dialogFile})}>+</button>
          </div>
          <button className="file-chip" onClick={async () => {
            const selected = await window.llmtrans.files.chooseCookie();
            if (selected) setCookieFile(selected);
          }}><Cookie size={16} /><span><b>Cookies file</b>{cookieFile || 'Not selected'}</span></button>
          <button className="file-chip" onClick={async () => {
            const selected = await window.llmtrans.files.chooseDialogue();
            if (selected) setDialogFile(selected);
          }}><FileText size={16} /><span><b>Conversation file</b>{dialogFile || 'Not selected'}</span></button>
          <input value={conversationName} onChange={(event) => setConversationName(event.target.value)} placeholder="Conversation name" />
          <button className="primary-action small" onClick={() => onCreateConversation({name: conversationName, cookieFile, dialogFile})}>Create Conversation</button>
        </LiquidGlass>
        <div className="conversation-list">
          <div className="section-label">Conversation List</div>
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
          <div><b>{nickname}</b><span>Local user</span></div>
          <Settings size={18} />
        </LiquidGlass>
      </aside>

      <section className="chat-main">
        <header className="chat-header">
          <div>
            <h1>{activeConversation?.name ?? 'Select or create a conversation'}</h1>
            <div className={`online-line ${isCurrentRunning ? '' : 'offline'}`}><span /> {
              isCurrentRunning ? 'Running' : isCurrentStarting ? 'Starting Python workers...' : 'Not running'
            }</div>
          </div>
          <div className="chat-header-actions">
            <button className="glass-button">AI: {aiProvider}</button>
            {isCurrentRunning || isCurrentStarting
              ? <button className="glass-button" onClick={onStop}><Power size={16} /> Stop</button>
              : <button className="primary-action inline" disabled={!activeConversation} onClick={onStart}><Power size={16} /> Start</button>}
            <button className="icon-button"><MoreHorizontal size={20} /></button>
          </div>
        </header>
        {error && <div className="chat-error"><Info size={16} /> {error}</div>}
        <div ref={scrollRef} className="message-list">
          {messages.map((item) => <MessageBubble key={item.id} message={item} accountName={accountName} nickname={nickname} avatarUrl={avatarUrl} />)}
          {!activeConversation && <div className="system-message">Create a conversation by selecting a Cookie file and a dialogue file.</div>}
        </div>
        <footer className="composer-wrap">
          <LiquidGlass className="composer" strong>
            <button className="icon-button"><Paperclip size={20} /></button>
            <textarea disabled={!isCurrentRunning} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }} placeholder={isCurrentRunning ? 'Type a message...' : 'Start this conversation before sending'} rows={1} />
            <button className="send-button" disabled={!isCurrentRunning} onClick={send}><Send size={18} /></button>
          </LiquidGlass>
        </footer>
      </section>
    </main>
  );
}

function VpnPage({connected, onToggle, mode, onModeChange}: {connected: boolean; onToggle: () => void; mode: ProxyMode; onModeChange: (mode: ProxyMode) => void}) {
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
          <h1>{connected ? 'Protected' : 'Disconnected'}</h1>
          <p><span className={connected ? 'green-dot' : 'red-dot'} /> {connected ? 'Connected to Zurich, CH-01' : 'Tunnel is offline'}</p>
        </div>
        <div className="metric-grid">
          <Metric icon={<ArrowUp />} label="Upload" value={`${upload} MB/s`} />
          <Metric icon={<ArrowDown />} label="Download" value={`${download} MB/s`} />
          <Metric icon={<Activity />} label="Total Traffic" value={connected ? `${(4.2 + tick * 0.01).toFixed(2)} GB` : '0 GB'} />
          <Metric icon={<Gauge />} label="Duration" value={connected ? `04:${String(12 + Math.floor(tick / 60)).padStart(2, '0')}:${String(tick % 60).padStart(2, '0')}` : '00:00:00'} mono />
        </div>
      </section>
      <div className="vpn-grid">
        <LiquidGlass className="route-panel">
          <h2><Route size={21} /> Routing Mode</h2>
          {(['Global', 'Rule-based', 'Direct', 'Research Tunnel'] as ProxyMode[]).map((item) => (
            <button key={item} className={mode === item ? 'selected' : ''} onClick={() => onModeChange(item)}>
              <span>{item}</span>
              {mode === item && <CheckCircle2 size={18} />}
            </button>
          ))}
        </LiquidGlass>
        <LiquidGlass className="node-panel">
          <div className="panel-head"><h2>Node Selection</h2><div className="search-box"><Search size={16} /><input placeholder="Filter nodes..." /></div></div>
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
  const avatarInput = useRef<HTMLInputElement | null>(null);
  return (
    <PageFrame>
      <header className="page-header compact">
        <div className="eyebrow cyan">Workspace Preferences</div>
        <h1>Settings</h1>
        <p>Manage your local profile, interface style, communication AI, and file defaults.</p>
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
          <p>Local research identity</p>
          <label><span className="field-label">Nickname</span><input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} /></label>
          <label><span className="field-label">Local User ID</span><div className="copy-field"><input readOnly value="SM-LOCAL-8492-X" /><button><Copy size={16} /></button></div></label>
        </LiquidGlass>
        <div className="settings-panels">
          <LiquidGlass className="settings-section">
            <h2><Bot size={21} /> Communication AI</h2>
            <div className="choice-grid three">
              {(['Doubao', 'Other AI', 'Custom Provider'] as AiProvider[]).map((provider) => (
                <button key={provider} className={aiProvider === provider ? 'selected' : ''} onClick={() => onAiProviderChange(provider)}>
                  <b>{provider}</b><span>{provider === 'Doubao' ? 'Current channel' : 'Placeholder'}</span>
                </button>
              ))}
            </div>
          </LiquidGlass>
          <LiquidGlass className="settings-section">
            <h2><Palette size={21} /> Appearance</h2>
            <div className="theme-grid">
              {(['Dark Glass', 'Light', 'High Contrast', 'Blue Research'] as ThemeChoice[]).map((theme) => (
                <button key={theme} className={themeChoice === theme ? 'selected' : ''} onClick={() => onThemeChoiceChange(theme)}>
                  <span className={`theme-swatch swatch-${theme.toLowerCase().replaceAll(' ', '-')}`} />
                  <b>{theme}</b>
                </button>
              ))}
            </div>
          </LiquidGlass>
          <div className="split-panels">
            <LiquidGlass className="settings-section">
              <h2><MessageSquare size={21} /> Message Behavior</h2>
              <ToggleRow title="Polling interval" detail="1 second demo interval" control={<select><option>1 second</option><option>3 seconds</option></select>} />
              <ToggleRow title="Show echoed messages" detail="Keep self-confirmed messages visible." enabled />
              <ToggleRow title="Save local history" detail="Persist messages on this device." enabled />
            </LiquidGlass>
            <LiquidGlass className="settings-section">
              <h2><FolderOpen size={21} /> File Storage</h2>
              <label><span className="field-label">Cookies folder</span><input value="Core_Architecture/cookies" readOnly /></label>
              <label><span className="field-label">Conversation folder</span><input value="Core_Architecture/test" readOnly /></label>
              <label><span className="field-label">Log folder</span><input value="logs/llmtrans" readOnly /></label>
            </LiquidGlass>
          </div>
          <div className="settings-actions"><button className="secondary-action">Cancel</button><button className="primary-action inline"><Save size={17} /> Save Preferences</button></div>
        </div>
      </div>
    </PageFrame>
  );
}

function AboutPage() {
  return (
    <PageFrame>
      <header className="page-header compact">
        <div className="eyebrow cyan">About llmtrans</div>
        <h1>Built for academic research and prototype validation.</h1>
      </header>
      <div className="about-grid">
        <LiquidGlass className="research-card">
          <h2><Sparkles size={22} /> Research Intent</h2>
          <p>llmtrans is a controlled desktop environment for studying AI-mediated communication channels, local identity protocols, and experimental message routing workflows.</p>
          <p>The current UI prototype is intentionally separated from the crawler communication core so design, usability, and interaction flow can be validated first.</p>
        </LiquidGlass>
        <LiquidGlass className="affiliation-card">
          <h2>Affiliation</h2>
          <div className="affiliation-line"><Shield /><div><b>Nankai University</b><span>Research prototype workspace</span></div></div>
          <MiniStat label="Team" value="3 people" />
          <MiniStat label="Use" value="Academic" />
        </LiquidGlass>
      </div>
      <section className="team-section">
        <h2><Users size={22} /> Research Team</h2>
        <div className="team-grid">
          <TeamCard initials="T" role="Teacher / Supervisor" name="Project Supervisor" contribution="Guides research direction, validates academic scope, and reviews project architecture." />
          <TeamCard initials="S1" role="Student 1" name="Student Developer" contribution="Implements desktop UI, message protocol, and bridge integration workflow." />
          <TeamCard initials="S2" role="Student 2" name="Student Developer" contribution="Works on crawler channel verification, packaging, documentation, and demo readiness." />
        </div>
      </section>
      <footer className="about-footer">llmtrans Core UI Prototype · 版权所有南开大学llmtrans团队 · Academic research only</footer>
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

function Metric({icon, label, value, mono = false}: {icon: React.ReactNode; label: string; value: string; mono?: boolean}) {
  return <LiquidGlass className="metric-card">{icon}<span>{label}</span><b className={mono ? 'mono' : ''}>{value}</b></LiquidGlass>;
}

function Node({flag, name, latency, meta, active = false, offline = false}: {flag: string; name: string; latency: string; meta: string; active?: boolean; offline?: boolean}) {
  return <button className={`node-card ${active ? 'active' : ''} ${offline ? 'offline' : ''}`}><span>{flag}</span><div><b>{name}</b><small>{meta}</small></div><em>{latency}</em></button>;
}

function ToggleRow({title, detail, enabled, control}: {title: string; detail: string; enabled?: boolean; control?: React.ReactNode}) {
  return <div className="toggle-row"><div><b>{title}</b><span>{detail}</span></div>{control ?? <button className={`toggle ${enabled ? 'enabled' : ''}`}><span /></button>}</div>;
}

function TeamCard({initials, role, name, contribution}: {initials: string; role: string; name: string; contribution: string}) {
  return <LiquidGlass className="team-card"><div className="team-avatar">{initials}</div><h3>{name}</h3><b>{role}</b><p>{contribution}</p></LiquidGlass>;
}
