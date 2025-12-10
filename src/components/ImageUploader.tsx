import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

interface ImageUploaderProps {
    onImageSelect: (base64: string) => void;
    onFileSelect?: (file: File) => void;
}

export function ImageUploader({ onImageSelect, onFileSelect }: ImageUploaderProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);

        try {
            if (file.type === 'application/pdf') {
                // Pass PDF file to parent for page selection
                if (onFileSelect) {
                    onFileSelect(file);
                } else {
                    // Fallback: just show error if onFileSelect not provided
                    setError('PDF handling not configured');
                }
                setIsProcessing(false);
            } else if (file.type.startsWith('image/')) {
                // Handle image files - convert to PNG for consistency
                const reader = new FileReader();
                reader.onload = () => {
                    const img = new Image();
                    img.onload = () => {
                        try {
                            // Create canvas and convert to PNG
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');

                            if (!ctx) {
                                setError('Failed to create canvas context');
                                setIsProcessing(false);
                                return;
                            }

                            // Draw image and convert to PNG
                            ctx.drawImage(img, 0, 0);
                            const pngDataUrl = canvas.toDataURL('image/png');
                            onImageSelect(pngDataUrl);
                            setIsProcessing(false);
                        } catch (err) {
                            console.error('Error converting image:', err);
                            setError(`Failed to convert image: ${err instanceof Error ? err.message : 'Unknown error'}`);
                            setIsProcessing(false);
                        }
                    };
                    img.onerror = () => {
                        setError('Failed to load image. The file may be corrupted or in an unsupported format.');
                        setIsProcessing(false);
                    };
                    img.src = reader.result as string;
                };
                reader.onerror = () => {
                    setError('Failed to read file.');
                    setIsProcessing(false);
                };
                reader.readAsDataURL(file);
            } else {
                setError('Unsupported file type. Please upload an image or PDF file.');
                setIsProcessing(false);
            }
        } catch (err) {
            console.error('Error processing file:', err);
            setError(`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setIsProcessing(false);
        }
    }, [onImageSelect, onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    return (
        <div
            className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 m-8 rounded-xl bg-gray-800/50 hover:bg-gray-800/80 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                {isProcessing ? (
                    <div className="w-10 h-10 border-4 border-gray-400 border-t-blue-500 rounded-full animate-spin" />
                ) : (
                    <Upload className="w-10 h-10 text-gray-400" />
                )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
                {isProcessing ? 'Processing...' : 'Upload an Image or PDF'}
            </h2>
            <p className="text-gray-400 mb-8 text-center max-w-md">
                Drag and drop your file here, or click to browse.
                Supports JPG, PNG, and PDF files.
            </p>
            {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm max-w-md">
                    {error}
                </div>
            )}
            <label className={`px-6 py-3 ${isProcessing ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} text-white font-medium rounded-lg transition-colors`}>
                Browse Files
                <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={handleChange}
                    disabled={isProcessing}
                />
            </label>
        </div>
    );
}
