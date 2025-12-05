/// <reference types="vite/client" />

interface Window {
    electronAPI: {
        checkOllamaConnection: () => Promise<boolean>;
        getModels: () => Promise<any[]>;
        runOCR: (imageBase64: string, model?: string) => Promise<{ success: boolean; text?: string; error?: string }>;
        saveFile: (text: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
        onOCRChunk: (callback: (chunk: string) => void) => () => void;
        onOCRComplete: (callback: () => void) => () => void;
        onOCRError: (callback: (error: string) => void) => () => void;
        abortOCR: () => Promise<void>;
        quitApp: () => Promise<void>;
    };
}
