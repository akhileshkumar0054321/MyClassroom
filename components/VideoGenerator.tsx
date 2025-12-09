import React, { useState } from 'react';
import { generateVideoScript, generateVeoPreview } from '../services/gemini';
import { VideoScript } from '../types';
import { Play, Pause, Loader2, Video as VideoIcon, FileText } from 'lucide-react';

const VideoGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Veo State
  const [generatingVeo, setGeneratingVeo] = useState(false);
  const [veoUrl, setVeoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateVideoScript(topic, duration, 'English', 'Animated');
      setScript(result);
    } catch (error) {
      console.error("Failed to generate script", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVeo = async () => {
    if (!script) return;
    setGeneratingVeo(true);
    try {
        const previewPrompt = script.chapters[0].visualCue;
        const url = await generateVeoPreview(previewPrompt);
        setVeoUrl(url);
    } catch(e) {
        console.error(e);
    } finally {
        setGeneratingVeo(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <VideoIcon className="w-8 h-8 text-primary-500" />
        AI Video Generator
      </h2>

      {!script ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, The French Revolution, Calculus Basics"
                className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Duration: {duration} minutes
              </label>
              <input
                type="range"
                min="5"
                max="30"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Generate Video Plan'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player / Visuals Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black rounded-xl overflow-hidden aspect-video relative shadow-2xl flex items-center justify-center group">
               {veoUrl ? (
                   <video src={veoUrl} controls autoPlay loop className="w-full h-full object-cover" />
               ) : (
                <div className="text-center p-12">
                    <div className="text-6xl mb-4">🎬</div>
                    <h3 className="text-2xl text-white font-bold mb-2">{script.chapters[currentChapter].title}</h3>
                    <p className="text-gray-400 max-w-md mx-auto">{script.chapters[currentChapter].visualCue}</p>
                </div>
               )}
               
               {!veoUrl && (
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="bg-white/20 backdrop-blur-sm p-4 rounded-full hover:bg-white/30 transition-all"
                       >
                           {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
                       </button>
                   </div>
               )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Script & Narration</h3>
                    <div className="flex gap-2">
                         <button 
                            onClick={handleGenerateVeo}
                            disabled={generatingVeo}
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full flex items-center gap-1"
                        >
                            {generatingVeo ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Generate Veo Preview'}
                         </button>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                    {script.chapters[currentChapter].content}
                </p>
            </div>
          </div>

          {/* Chapters List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 h-fit">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Course Chapters</h3>
            <div className="space-y-3">
              {script.chapters.map((chapter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                      setCurrentChapter(idx);
                      setVeoUrl(null); // Reset video when changing chapter
                  }}
                  className={`w-full text-left p-4 rounded-lg transition-all border ${
                    currentChapter === idx 
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 ring-1 ring-primary-500' 
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold ${currentChapter === idx ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      Part {idx + 1}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {chapter.duration}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{chapter.title}</h4>
                </button>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setScript(null)}
                    className="text-sm text-gray-500 hover:text-red-500 w-full text-center"
                >
                    Start New Video
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
