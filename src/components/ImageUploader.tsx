import { Upload } from 'lucide-react';
import { useCallback } from 'react';

interface ImageUploaderProps {
    onImageSelect: (base64: string) => void;
}

export function ImageUploader({ onImageSelect }: ImageUploaderProps) {
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => {
                onImageSelect(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [onImageSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                onImageSelect(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [onImageSelect]);

    return (
        <div
            className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-700 m-8 rounded-xl bg-gray-800/50 hover:bg-gray-800/80 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload an Image</h2>
            <p className="text-gray-400 mb-8 text-center max-w-md">
                Drag and drop your image here, or click to browse.
                Supports JPG, PNG.
            </p>
            <label className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
                Browse Files
                <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                />
            </label>
        </div>
    );
}
