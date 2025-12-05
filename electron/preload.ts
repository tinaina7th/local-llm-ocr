import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
    checkOllamaConnection: () => ipcRenderer.invoke('ollama:check-connection'),
    getModels: () => ipcRenderer.invoke('ollama:get-models'),
    runOCR: (imageBase64: string, model: string) => ipcRenderer.invoke('ollama:run-ocr', { imageBase64, model }),
    saveFile: (text: string) => ipcRenderer.invoke('file:save', { text }),
    onOCRChunk: (callback: (chunk: string) => void) => {
        const subscription = (_: any, chunk: string) => callback(chunk);
        ipcRenderer.on('ocr-chunk', subscription);
        return () => ipcRenderer.removeListener('ocr-chunk', subscription);
    },
    onOCRComplete: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on('ocr-complete', subscription);
        return () => ipcRenderer.removeListener('ocr-complete', subscription);
    },
    onOCRError: (callback: (error: string) => void) => {
        const subscription = (_: any, error: string) => callback(error);
        ipcRenderer.on('ocr-error', subscription);
        return () => ipcRenderer.removeListener('ocr-error', subscription);
    },
    abortOCR: () => ipcRenderer.invoke('ollama:abort'),
    quitApp: () => ipcRenderer.invoke('app:quit'),
});
