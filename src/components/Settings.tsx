import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export function Settings() {
    const [model, setModel] = useState('deepseek-ocr:3b');
    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const storedModel = localStorage.getItem('ocr_model');
        if (storedModel) {
            setModel(storedModel);
        }

        const fetchModels = async () => {
            if (window.electronAPI) {
                const models = await window.electronAPI.getModels();
                setAvailableModels(models);
            }
        };
        fetchModels();
    }, []);

    const handleSave = () => {
        localStorage.setItem('ocr_model', model);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Ollama Model Name
                    </label>
                    {availableModels.length > 0 ? (
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="" disabled>Select a model</option>
                            {availableModels.map((m) => (
                                <option key={m.name} value={m.name}>
                                    {m.name}
                                </option>
                            ))}
                            {/* Allow custom input if model not in list? Maybe just add an "Other" option or keep input if list empty */}
                            {!availableModels.find(m => m.name === model) && model && (
                                <option value={model}>{model} (Custom)</option>
                            )}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. deepseek-ocr"
                        />
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                        Select the model you want to use. If the list is empty, ensure Ollama is running.
                        <br />
                        To install the default model, run: <code className="bg-gray-900 px-1 rounded">ollama pull deepseek-ocr</code>
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
