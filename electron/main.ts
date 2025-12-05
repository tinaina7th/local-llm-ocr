import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// In CommonJS, __dirname is available globally
// process.env.DIST = path.join(__dirname, '../dist');
// But with tsc outputting to dist-electron/main.js, __dirname is dist-electron.
// We want dist folder which is at ../dist
process.env.DIST = path.join(__dirname, '../dist');
const publicDir = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');
process.env.VITE_PUBLIC = publicDir;

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
    console.log('Preload path:', path.join(__dirname, 'preload.js'));
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(publicDir, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            // sandbox: true // Default is true, which is fine for CJS preload
        },
    });

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        if (process.env.DIST) {
            win.loadFile(path.join(process.env.DIST, 'index.html'));
        } else {
            console.error('DIST environment variable not set');
        }
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.whenReady().then(createWindow);

// IPC Handlers
ipcMain.handle('file:save', async (_, { text }) => {
    if (!win) return { success: false, error: 'No window' };
    const { canceled, filePath } = await import('electron').then(e => e.dialog.showSaveDialog(win!, {
        title: 'Save OCR Result',
        defaultPath: 'ocr-result.txt',
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    }));

    if (canceled || !filePath) return { success: false };

    try {
        const fs = await import('fs/promises');
        await fs.writeFile(filePath, text, 'utf-8');
        return { success: true, filePath };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('ollama:check-connection', async () => {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        return response.ok;
    } catch (error) {
        return false;
    }
});

ipcMain.handle('ollama:get-models', async () => {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) return [];
        const data = await response.json();
        return data.models || [];
    } catch (error) {
        console.error('Failed to fetch models:', error);
        return [];
    }
});

let currentAbortController: AbortController | null = null;
ipcMain.handle('ollama:abort', () => {
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
    }
});

ipcMain.handle('app:quit', () => {
    app.quit();
});

ipcMain.handle('ollama:run-ocr', async (event, { imageBase64, model }) => {
    console.log(`Running OCR with model: ${model}`);
    const sender = event.sender;

    // Abort previous request if any
    if (currentAbortController) {
        currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: currentAbortController.signal,
            body: JSON.stringify({
                model: model || 'deepseek-ocr:3b',
                system: `画像内のテキストを読み取り、読み順どおりに抽出してください。
見出し・太字・箇条書きなどは可能な限りMarkdownで再現してください。
ページ番号やフッターは無視してください。`,
                prompt: '画像の内容を書き起こしてください。',
                images: [imageBase64],
                stream: true,
                options: {
                    temperature: 0,
                    repeat_penalty: 1.2
                }
            })
        });

        console.log('Ollama status:', response.status);

        if (!response.ok) {
            const text = await response.text();
            console.error('Ollama error:', text);
            sender.send('ocr-error', `Ollama API Error: ${response.status} ${text}`);
            return { success: false, error: `Ollama API Error: ${response.status} ${text}` };
        }

        if (!response.body) {
            sender.send('ocr-error', 'No response body');
            return { success: false, error: 'No response body' };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.response) {
                        sender.send('ocr-chunk', json.response);
                    }
                    if (json.error) {
                        sender.send('ocr-error', json.error);
                        return { success: false, error: json.error };
                    }
                } catch (e) {
                    console.error('Error parsing JSON chunk:', e);
                }
            }
        }

        if (buffer.trim()) {
            try {
                const json = JSON.parse(buffer);
                if (json.response) {
                    sender.send('ocr-chunk', json.response);
                }
            } catch (e) { }
        }

        sender.send('ocr-complete');
        currentAbortController = null;
        return { success: true };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('OCR Aborted');
            sender.send('ocr-error', 'Aborted by user');
            return { success: false, error: 'Aborted' };
        }
        console.error('OCR Error:', error);
        sender.send('ocr-error', error.message);
        return { success: false, error: error.message };
    } finally {
        if (currentAbortController?.signal.aborted) {
            currentAbortController = null;
        }
    }
});
