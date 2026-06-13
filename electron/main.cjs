const {app, BrowserWindow, dialog, ipcMain, shell} = require('electron');
const path = require('path');
const fs = require('fs');
const {DatabaseService} = require('./database.cjs');
const {WorkerManager} = require('./worker-manager.cjs');

let mainWindow = null;
let database = null;
let workers = null;
let sessionAccount = null;

function runtimeRoot() {
  return app.isPackaged ? process.resourcesPath : path.join(__dirname, '..');
}

function registerIpc() {
  ipcMain.handle('auth:current', () => sessionAccount);
  ipcMain.handle('auth:register', (_event, payload) => {
    sessionAccount = database.register(payload);
    return sessionAccount;
  });
  ipcMain.handle('auth:login', (_event, payload) => {
    sessionAccount = database.login(payload);
    return sessionAccount;
  });
  ipcMain.handle('auth:logout', async () => {
    await workers.stop();
    sessionAccount = null;
    return true;
  });

  ipcMain.handle('files:choose-cookie', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 Cookie 文件',
      properties: ['openFile'],
      filters: [{name: 'Cookie files', extensions: ['json', 'txt']}],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('files:choose-dialogue', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择对话文件',
      properties: ['openFile'],
      filters: [{name: 'Dialogue files', extensions: ['txt', 'json', 'md']}],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('files:choose-send', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择要发送的文件',
      properties: ['openFile'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('files:list', (_event, conversationId) => database.listFileTransfers(conversationId));
  ipcMain.handle('files:send', (_event, {conversationId, filePath}) => {
    const status = workers.getStatus();
    const account = sessionAccount;
    if (!account) throw new Error('请先登录');
    if (status.status !== 'running' || status.conversationId !== conversationId) {
      throw new Error('请先启动当前对话');
    }
    const queued = workers.sendFile(filePath);
    const transfer = database.addFileTransfer({
      id: queued.transferId,
      conversationId,
      senderAccount: account.accountName,
      senderNickname: account.nickname,
      fileName: queued.fileName,
      filePath: queued.filePath,
      direction: 'self',
      status: 'sending',
      sentAt: queued.sentAt,
    });
    mainWindow?.webContents.send('files:changed', transfer);
    return transfer;
  });
  ipcMain.handle('files:open-location', (_event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) throw new Error('文件不存在');
    shell.showItemInFolder(filePath);
    return true;
  });
  ipcMain.handle('files:open', async (_event, filePath) => {
    if (!filePath || !fs.existsSync(filePath)) throw new Error('文件不存在');
    const error = await shell.openPath(filePath);
    if (error) throw new Error(error);
    return true;
  });

  ipcMain.handle('conversations:list', () => database.listConversations());
  ipcMain.handle('conversations:create', (_event, payload) => database.createConversation(payload));
  ipcMain.handle('conversations:status', () => workers.getStatus());
  ipcMain.handle('conversations:start', async (_event, id) => {
    const conversation = database.getConversation(id);
    const account = sessionAccount;
    if (!conversation) throw new Error('对话不存在');
    if (!account) throw new Error('请先登录');
    const receiveDirectory = path.join(app.getPath('downloads'), 'llmtrans', conversation.id);
    return workers.start({conversation, account, receiveDirectory});
  });
  ipcMain.handle('conversations:stop', () => workers.stop());

  ipcMain.handle('messages:list', (_event, conversationId) => {
    const account = sessionAccount;
    if (!account) throw new Error('请先登录');
    return database.listMessages(conversationId, account.accountName);
  });
  ipcMain.handle('messages:send', (_event, {conversationId, content}) => {
    const status = workers.getStatus();
    if (status.status !== 'running' || status.conversationId !== conversationId) {
      throw new Error('请先启动当前对话');
    }
    const payload = workers.send(content);
    database.addMessage({
      id: payload.messageId,
      conversationId,
      senderAccount: payload.senderAccount,
      senderNickname: payload.senderNickname,
      content: payload.content,
      direction: 'self',
      status: 'sent',
      sentAt: payload.sentAt,
    });
    return database.getMessage(payload.messageId, payload.senderAccount);
  });
}

function createWindow() {
  const smokeTest = process.env.LLMTRANS_SMOKE_TEST === '1';
  const smokeFile = process.env.LLMTRANS_SMOKE_FILE;
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1120,
    minHeight: 720,
    title: 'llmtrans',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    backgroundColor: '#070911',
    autoHideMenuBar: true,
    show: !smokeTest,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWindow.webContents.on('did-fail-load', (_event, code, description, validatedURL) => {
    const error = {ok: false, code, description, validatedURL};
    if (smokeFile) fs.writeFileSync(smokeFile, JSON.stringify(error));
    console.error(`[llmtrans-load-error] ${code} ${description} ${validatedURL}`);
    if (smokeTest) app.exit(1);
  });

  if (smokeTest) {
    mainWindow.webContents.once('did-finish-load', async () => {
      try {
        const result = await mainWindow.webContents.executeJavaScript(`
          (async () => ({
            title: document.title,
            rootText: document.querySelector('#root')?.textContent?.slice(0, 120) || '',
            childCount: document.querySelector('#root')?.childElementCount || 0,
            apiAvailable: typeof window.llmtrans === 'object',
            currentAccount: typeof window.llmtrans === 'object' ? await window.llmtrans.auth.current() : null
          }))()
        `);
        if (smokeFile) fs.writeFileSync(smokeFile, JSON.stringify({ok: true, ...result}));
        console.log(`[llmtrans-smoke] ${JSON.stringify(result)}`);
        app.exit(result.childCount > 0 && result.rootText.includes('llmtrans') && result.apiAvailable ? 0 : 1);
      } catch (error) {
        if (smokeFile) fs.writeFileSync(smokeFile, JSON.stringify({ok: false, error: String(error.stack || error)}));
        console.error(`[llmtrans-smoke-error] ${error.stack || error}`);
        app.exit(1);
      }
    });
  }

  mainWindow.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: 'deny'};
  });
}

app.whenReady().then(() => {
  app.setName('llmtrans');
  database = new DatabaseService(path.join(app.getPath('userData'), 'data'));
  database.clearLegacyLoginSession();
  database.ensureFixedConversation({
    cookiePath: path.join(runtimeRoot(), 'Core_Architecture', 'cookies', 'cookies.json'),
    dialoguePath: path.join(runtimeRoot(), 'Core_Architecture', 'test', 'test5.txt'),
  });
  workers = new WorkerManager(runtimeRoot());
  registerIpc();
  workers.on('status', (payload) => mainWindow?.webContents.send('worker:status', payload));
  workers.on('error-event', (payload) => {
    if (payload.conversationId) database.setConversationError(payload.conversationId, payload.message);
    mainWindow?.webContents.send('worker:error', payload);
  });
  workers.on('message', (payload) => {
    const conversationId = workers.getStatus().conversationId;
    const account = sessionAccount;
    if (!conversationId || !account) return;
    database.addMessage({
      id: payload.messageId,
      conversationId,
      senderAccount: payload.senderAccount,
      senderNickname: payload.senderNickname,
      content: payload.content,
      direction: payload.senderAccount.toLowerCase() === account.accountName.toLowerCase() ? 'self' : 'peer',
      status: 'received',
      sentAt: payload.sentAt || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    });
    const message = database.getMessage(payload.messageId, account.accountName);
    mainWindow?.webContents.send('messages:new', message);
  });
  workers.on('file-event', (payload) => {
    const conversationId = workers.getStatus().conversationId;
    const account = sessionAccount;
    if (!conversationId || !account) return;
    let transfer = null;
    if (payload.type === 'sent') {
      transfer = database.updateFileTransfer(payload.transferId, 'sent');
    } else if (payload.type === 'error') {
      transfer = database.updateFileTransfer(payload.transferId, 'error', payload.message);
    } else if (payload.type === 'received') {
      transfer = database.addFileTransfer({
        id: payload.transferId,
        conversationId,
        senderAccount: 'remote-file',
        senderNickname: 'Remote user',
        fileName: payload.fileName,
        filePath: payload.filePath,
        direction: 'peer',
        status: 'received',
        sentAt: new Date().toISOString(),
      });
    }
    if (transfer) mainWindow?.webContents.send('files:changed', transfer);
  });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  workers?.stop();
  database?.close();
});
