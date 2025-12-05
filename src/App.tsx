import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { OCRViewer } from './components/OCRViewer';
import { ImageUploader } from './components/ImageUploader';
import { Settings } from './components/Settings';

function App() {
    const [currentView, setCurrentView] = useState<'upload' | 'settings'>('upload');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const checkConnection = async () => {
            if (window.electronAPI) {
                const status = await window.electronAPI.checkOllamaConnection();
                setIsConnected(status);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleNavigate = (view: 'upload' | 'settings') => {
        setCurrentView(view);
        if (view === 'settings') {
            setSelectedImage(null);
        }
    };

    const renderContent = () => {
        if (currentView === 'settings') {
            return <Settings />;
        }

        if (selectedImage) {
            return (
                <OCRViewer
                    image={selectedImage}
                    onBack={() => setSelectedImage(null)}
                />
            );
        }

        return <ImageUploader onImageSelect={setSelectedImage} />;
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <Sidebar
                isConnected={isConnected}
                currentView={currentView}
                onNavigate={handleNavigate}
            />
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {renderContent()}
            </main>
        </div>
    );
}

export default App;
