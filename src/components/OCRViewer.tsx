import { useState } from 'react';
import { ArrowLeft, Play, Save, Copy, Check, FileText } from 'lucide-react';
import { PDFPageImage } from '../utils/pdfToImage';

interface OCRViewerProps {
    image?: string;
    pages?: PDFPageImage[];
    onBack: () => void;
}

export function OCRViewer({ image, pages, onBack }: OCRViewerProps) {
    const [result, setResult] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [currentProcessingPage, setCurrentProcessingPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);

    const isMultiPage = !!pages && pages.length > 0;
    const displayImage = isMultiPage ? (pages[0]?.imageData || '') : (image || '');

    const processImage = async (imageData: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const base64Data = imageData.split(',')[1];
            let pageResult = '';

            if (!window.electronAPI) {
                reject('Electron API not available');
                return;
            }

            if (!window.electronAPI.onOCRChunk) {
                reject('Application update pending. Please restart the application.');
                return;
            }

            const removeChunkListener = window.electronAPI.onOCRChunk((chunk: string) => {
                pageResult += chunk;
                setResult(prev => prev + chunk);
            });

            const removeCompleteListener = window.electronAPI.onOCRComplete(() => {
                removeChunkListener();
                removeCompleteListener();
                removeErrorListener();
                resolve(pageResult);
            });

            const removeErrorListener = window.electronAPI.onOCRError((error: string) => {
                console.error('OCR Error event:', error);
                removeChunkListener();
                removeCompleteListener();
                removeErrorListener();
                reject(error);
            });

            const model = localStorage.getItem('ocr_model') || 'deepseek-ocr';
            window.electronAPI.runOCR(base64Data, model);
        });
    };

    const runOCR = async () => {
        setIsProcessing(true);
        setResult('');

        try {
            if (isMultiPage && pages) {
                // Process multiple pages
                setTotalPages(pages.length);
                for (let i = 0; i < pages.length; i++) {
                    setCurrentProcessingPage(i + 1);
                    const pageHeader = `\n${'='.repeat(50)}\nPage ${i + 1} of ${pages.length}\n${'='.repeat(50)}\n\n`;
                    setResult(prev => prev + pageHeader);

                    try {
                        await processImage(pages[i].imageData);
                        setResult(prev => prev + '\n\n');
                    } catch (error) {
                        setResult(prev => prev + `\nError processing page ${i + 1}: ${error}\n\n`);
                    }
                }
                setIsProcessing(false);
            } else if (image) {
                // Process single image
                await processImage(image);
                setIsProcessing(false);
            }
        } catch (e) {
            console.error('OCR Exception:', e);
            setResult(prev => prev + `\nError: ${e}`);
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
                    <div className="text-sm font-medium text-gray-400">
                        {isMultiPage ? `PDF Pages (${pages.length} pages)` : 'Original Image'}
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-black/20">
                    {isMultiPage && pages ? (
                        <div className="w-full h-full overflow-y-auto space-y-4">
                            {pages.map((page, idx) => (
                                <div key={idx} className="flex flex-col items-center">
                                    <div className="text-xs text-gray-400 mb-2">Page {page.pageNumber}</div>
                                    <img
                                        src={page.imageData}
                                        alt={`Page ${page.pageNumber}`}
                                        className="max-w-full object-contain rounded-lg shadow-lg"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <img src={displayImage} alt="Source" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                    )}
                </div>
            </div>

            {/* Result Pane */}
            <div className="w-1/2 flex flex-col bg-gray-800">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-400">
                        OCR Result
                        {isProcessing && isMultiPage && totalPages > 0 && (
                            <span className="ml-2 text-blue-400">
                                (Processing page {currentProcessingPage} of {totalPages})
                            </span>
                        )}
                    </div>
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
