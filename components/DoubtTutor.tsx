import React, { useState, useRef } from 'react';
import { resolveDoubt } from '../services/gemini';
import { HelpCircle, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const DoubtTutor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data URL prefix for Gemini API if needed, 
        // but our service handles inlineData which expects base64 without prefix usually?
        // Wait, inlineData expects "base64 encoded string". 
        // reader.result looks like "data:image/jpeg;base64,..."
        // We need to strip the prefix.
        const result = reader.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBase64Data = (dataUrl: string) => {
      return dataUrl.split(',')[1];
  }

  const handleSolve = async () => {
    if (!query && !image) return;
    setLoading(true);
    try {
      const imgData = image ? getBase64Data(image) : undefined;
      const res = await resolveDoubt(query || "Solve this problem", imgData);
      setResponse(res);
    } catch (e) {
      console.error(e);
      setResponse("Sorry, I couldn't solve that right now. Please check your connection or API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
            <HelpCircle className="w-6 h-6 text-purple-600 dark:text-purple-300" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Personalized Doubt Tutor</h2>
      </div>

      <div className="flex-1 overflow-y-auto mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-inner p-6 border border-gray-200 dark:border-gray-700">
        {!response && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <p>Upload a photo of a math problem or type your question.</p>
          </div>
        )}
        {loading && (
          <div className="h-full flex items-center justify-center text-primary-500">
            <Loader2 className="w-12 h-12 animate-spin" />
            <span className="ml-3 font-medium">Analyzing problem...</span>
          </div>
        )}
        {response && (
           <div className="prose dark:prose-invert max-w-none">
             <h3 className="text-lg font-semibold text-green-600 mb-4">Solution</h3>
             <ReactMarkdown>{response}</ReactMarkdown>
           </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {image && (
          <div className="mb-4 relative inline-block">
             <img src={image} alt="Preview" className="h-32 rounded-lg border border-gray-300" />
             <button 
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
             >
                ×
             </button>
          </div>
        )}
        <div className="flex gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSolve()}
            placeholder="Type your question here (or leave empty if uploading image)..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400"
          />
          <button 
            onClick={handleSolve}
            disabled={loading || (!query && !image)}
            className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoubtTutor;
