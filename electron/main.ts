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
        let accumulatedText = '';

        // Function to detect repeated sentences
        const detectRepetition = (text: string): boolean => {
            // Split text into sentences (by periods, newlines, or other sentence endings)
            const sentences = text.split(/[。\.!\?！？\n]+/).filter(s => s.trim().length > 10);

            if (sentences.length < 3) return false;

            // Check if the last 3 sentences contain repetition
            const lastSentences = sentences.slice(-6); // Check last 6 sentences

            // Count occurrences of each sentence
            const sentenceCount = new Map<string, number>();
            for (const sentence of lastSentences) {
                const trimmed = sentence.trim();
                if (trimmed.length > 10) { // Only check substantial sentences
                    sentenceCount.set(trimmed, (sentenceCount.get(trimmed) || 0) + 1);
                }
            }

            // If any sentence appears 3 or more times, it's a repetition
            for (const count of sentenceCount.values()) {
                if (count >= 3) {
                    return true;
                }
            }

            // Check for alternating patterns (A, B, A, B, ...)
            // Look at the last 8 sentences to detect alternating repetition
            if (sentences.length >= 4) {
                const recentSentences = sentences.slice(-8);
                for (let i = 0; i < recentSentences.length - 3; i++) {
                    const a = recentSentences[i].trim();
                    const b = recentSentences[i + 1].trim();
                    const a2 = recentSentences[i + 2].trim();
                    const b2 = recentSentences[i + 3].trim();

                    // Check if we have A, B, A, B pattern
                    if (a.length > 10 && b.length > 10 &&
                        a === a2 && b === b2 && a !== b) {
                        console.log('Alternating pattern detected:', a.substring(0, 50), '...', b.substring(0, 50), '...');
                        return true;
                    }
                }
            }

            // Check for repeating chunks in the last part of text
            const lastChars = text.slice(-600); // Check last 600 characters
            if (lastChars.length >= 200) {
                // Try different chunk sizes to detect repetition
                for (let chunkSize = 50; chunkSize <= 300; chunkSize += 50) {
                    if (lastChars.length < chunkSize * 2) continue;

                    const lastChunk = lastChars.slice(-chunkSize);
                    const previousChunk = lastChars.slice(-chunkSize * 2, -chunkSize);

                    // If the last two chunks are identical, it's a repetition
                    if (lastChunk === previousChunk && lastChunk.trim().length > 30) {
                        console.log('Repeating chunk detected, size:', chunkSize);
                        return true;
                    }
                }
            }

            return false;
        };

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
                        accumulatedText += json.response;

                        // Check for repetition
                        if (detectRepetition(accumulatedText)) {
                            console.log('Repetition detected, stopping OCR');
                            reader.cancel();
                            sender.send('ocr-error', 'Repetition detected: The model is generating repeated sentences. OCR stopped.');
                            return { success: false, error: 'Repetition detected' };
                        }

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
