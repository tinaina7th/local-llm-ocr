import { Circle, FileText, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
    isConnected: boolean;
    currentView: 'upload' | 'settings';
    onNavigate: (view: 'upload' | 'settings') => void;
}

export function Sidebar({ isConnected, currentView, onNavigate }: SidebarProps) {
    return (
        <div className="w-64 shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-lg text-white">Local DeepSeek OCR</h1>
            </div>

            <div className="flex-1 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Menu
                </div>
                <nav className="space-y-2">
                    <button
                        onClick={() => onNavigate('upload')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'upload'
                            ? 'text-white bg-gray-700'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        New Scan
                    </button>
                    <button
                        onClick={() => onNavigate('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentView === 'settings'
                            ? 'text-white bg-gray-700'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                    <button
                        onClick={() => {
                            if (window.electronAPI) {
                                window.electronAPI.quitApp();
                            }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-red-400 hover:text-red-300 hover:bg-gray-700"
                    >
                        <LogOut className="w-4 h-4" />
                        Exit
                    </button>
                </nav>
            </div>

            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                    <Circle className={`w-3 h-3 ${isConnected ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`} />
                    <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                        {isConnected ? 'Ollama Connected' : 'Ollama Disconnected'}
                    </span>
                </div>
            </div>
        </div>
    );
}
