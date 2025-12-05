import { useState } from 'react';
import { ArrowLeft, Play, Save, Copy, Check, FileText } from 'lucide-react';

interface OCRViewerProps {
    image: string;
    onBack: () => void;
}

export function OCRViewer({ image, onBack }: OCRViewerProps) {
    const [result, setResult] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);

    const runOCR = async () => {
        setIsProcessing(true);
        setResult(''); // Clear previous result
        try {
            // Remove data:image/png;base64, prefix for Ollama
            const base64Data = image.split(',')[1];

            if (window.electronAPI) {
                if (!window.electronAPI.onOCRChunk) {
                    setResult('Error: Application update pending. Please restart the application to apply changes.');
                    setIsProcessing(false);
                    return;
                }

                console.log('Setting up OCR event listeners');
                // Setup event listeners
                const removeChunkListener = window.electronAPI.onOCRChunk((chunk: string) => {
                    console.log('Received chunk:', chunk.length);
                    setResult(prev => prev + chunk);
                });

                const removeCompleteListener = window.electronAPI.onOCRComplete(() => {
                    console.log('OCR Complete');
                    setIsProcessing(false);
                    removeChunkListener();
                    removeCompleteListener();
                    removeErrorListener();
                });

                const removeErrorListener = window.electronAPI.onOCRError((error: string) => {
                    console.error('OCR Error event:', error);
                    setResult(prev => prev + `\nError: ${error}`);
                    setIsProcessing(false);
                    removeChunkListener();
                    removeCompleteListener();
                    removeErrorListener();
                });

                const model = localStorage.getItem('ocr_model') || 'deepseek-ocr';
                console.log('Starting OCR with model:', model);
                await window.electronAPI.runOCR(base64Data, model);
            } else {
                // Fallback for browser mode (mock or error)
                setResult('Error: Electron API not available. Please run in Electron.');
                setIsProcessing(false);
            }
        } catch (e) {
            console.error('OCR Exception:', e);
            setResult(`Error: ${e}`);
            setIsProcessing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStop = async () => {
        if (window.electronAPI) {
            await window.electronAPI.abortOCR();
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex h-full">
            {/* Image Pane */}
            <div className="w-1/2 flex flex-col border-r border-gray-700 bg-gray-900">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <div className="text-sm font-medium text-gray-400">Original Image</div>
                </div>
                <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-black/20">
                    <img src={image} alt="Source" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                </div>
            </div>

            {/* Result Pane */}
            <div className="w-1/2 flex flex-col bg-gray-800">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-400">OCR Result</div>
                    <div className="flex items-center gap-2">
                        {result && (
                            <>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (window.electronAPI) {
                                            await window.electronAPI.saveFile(result);
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                                    title="Save to file"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        {isProcessing ? (
                            <button
                                onClick={handleStop}
                                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-600/20 transition-all"
                            >
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Stop
                            </button>
                        ) : (
                            <button
                                onClick={runOCR}
                                className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-600/20 transition-all"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Run OCR
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-auto">
                    {result ? (
                        <div className="prose prose-invert max-w-none whitespace-pre-wrap font-mono text-sm">
                            {result}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p>Click "Run OCR" to extract text</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
