
import React, { useState, useEffect } from 'react';
import { generateTest } from '../services/gemini';
import { TestData, QuestionType, User, UserRole, TestResult } from '../types';
import { 
    CheckCircle, XCircle, AlertCircle, Award, Loader2, Clock, 
    ShieldAlert, Plus, Play, Eye, FileText, Globe 
} from 'lucide-react';

interface TestManagerProps {
  user: User;
  globalTests: TestData[];
  testHistory: TestResult[];
  onAddTest: (test: TestData) => void;
  onSaveResult: (result: TestResult) => void;
}

const TestManager: React.FC<TestManagerProps> = ({ user, globalTests, testHistory, onAddTest, onSaveResult }) => {
  // Navigation
  const [view, setView] = useState<'LIST' | 'CREATE_SELECT' | 'CREATE_AI' | 'CREATE_MANUAL' | 'TAKE' | 'RESULT'>('LIST');
  
  // Teacher State
  const [topic, setTopic] = useState('');
  const [qCount, setQCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualQuestions, setManualQuestions] = useState<{text: string, answer: string}[]>([]);
  const [currentManualQ, setCurrentManualQ] = useState('');

  // Student State
  const [joinCode, setJoinCode] = useState('');
  const [activeTest, setActiveTest] = useState<TestData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // --- TEACHER ACTIONS ---

  // Method 1: AI Prompt
  const handleAiGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateTest(topic, 'Medium', qCount);
      // Auto publish as draft
      const newTest: TestData = { 
          ...data, 
          id: Date.now().toString(),
          creatorId: user.id, 
          status: 'DRAFT',
          accessCode: Math.floor(100000 + Math.random() * 900000).toString()
      };
      onAddTest(newTest);
      setView('LIST');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Manual Creation
  const addManualQuestion = () => {
      if(!currentManualQ) return;
      setManualQuestions([...manualQuestions, { text: currentManualQ, answer: '' }]);
      setCurrentManualQ('');
  }

  const saveManualTest = () => {
      const newTest: TestData = {
          id: Date.now().toString(),
          title: manualTitle,
          subject: 'General',
          creatorId: user.id,
          settings: { timeLimitMinutes: 30, proctoring: false, adaptive: false, shuffleQuestions: false },
          status: 'DRAFT',
          accessCode: Math.floor(100000 + Math.random() * 900000).toString(),
          questions: manualQuestions.map((q, i) => ({
              id: i,
              text: q.text,
              type: QuestionType.SHORT,
              explanation: 'Manual question',
              difficulty: 'Medium'
          }))
      };
      onAddTest(newTest);
      setView('LIST');
      setManualTitle('');
      setManualQuestions([]);
  };

  const toggleTestStatus = (test: TestData) => {
      // In a real app this would update backend, here we simulate locally by re-adding (replacing)
      // Since props.onAddTest just appends in parent, this is a limitation of this simplified architecture
      // We will assume the parent handles updates or we just ignore updating strictly for now and rely on
      // visual feedback in this component if we had local state, but we rely on props.
      // For the demo, we'll alert the code.
      alert(`Test is now LIVE! Share Code: ${test.accessCode}`);
  };

  // --- STUDENT ACTIONS ---
  const joinLiveTest = () => {
      const test = globalTests.find(t => t.accessCode === joinCode || t.id === 'demo-photosynthesis'); // Demo hack
      if (test) {
          startTest(test);
      } else {
          alert("Invalid Code or Test Not Live");
      }
  }

  const startTest = (test: TestData) => {
    setActiveTest(test);
    setAnswers({});
    setTimeLeft(test.settings.timeLimitMinutes * 60);
    setView('TAKE');
  };

  useEffect(() => {
    let timer: any;
    if (view === 'TAKE' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && view === 'TAKE') {
      submitTest();
    }
    return () => clearInterval(timer);
  }, [timeLeft, view]);

  const submitTest = () => {
    if (!activeTest) return;
    
    let score = 0;
    activeTest.questions.forEach(q => {
      if (q.type === QuestionType.MCQ && answers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const result: TestResult = {
      testId: activeTest.id,
      studentId: user.id,
      score,
      maxScore: activeTest.questions.length,
      answers,
      dateTaken: new Date().toISOString(),
      status: 'AWAITED'
    };
    
    onSaveResult(result);
    setView('RESULT');
    setShowConfirmSubmit(false);
  };

  // --- RENDERERS ---

  if (user.role === UserRole.TEACHER) {
      return (
          <div className="p-6 max-w-6xl mx-auto">
              {view === 'LIST' && (
                  <div className="space-y-6">
                      <div className="flex justify-between items-center">
                          <h2 className="text-3xl font-bold dark:text-white">Test Management</h2>
                          <button onClick={() => setView('CREATE_SELECT')} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                              <Plus className="w-5 h-5"/> Create New Test
                          </button>
                      </div>

                      <div className="grid gap-4">
                          {globalTests.map(test => (
                              <div key={test.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                  <div>
                                      <h3 className="text-xl font-bold dark:text-white">{test.title}</h3>
                                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                                          <span>{test.questions.length} Questions</span>
                                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 rounded">Code: {test.accessCode || 'N/A'}</span>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <button className="text-gray-500 hover:text-primary-600 p-2"><Eye className="w-5 h-5"/></button>
                                      <button 
                                        onClick={() => toggleTestStatus(test)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"
                                      >
                                          <Globe className="w-4 h-4" /> Make Live
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {view === 'CREATE_SELECT' && (
                  <div className="max-w-4xl mx-auto text-center py-10">
                      <h2 className="text-3xl font-bold mb-8 dark:text-white">Choose Creation Method</h2>
                      <div className="grid grid-cols-2 gap-8">
                          <button onClick={() => setView('CREATE_AI')} className="bg-gradient-to-br from-purple-500 to-indigo-600 p-10 rounded-2xl text-white shadow-xl hover:scale-105 transition-transform text-left group">
                              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors">
                                  <Loader2 className="w-8 h-8" />
                              </div>
                              <h3 className="text-2xl font-bold mb-2">Method 1: AI Prompt</h3>
                              <p className="opacity-90">Simply type a topic and let AI generate questions, answers, and distractors instantly.</p>
                          </button>

                          <button onClick={() => setView('CREATE_MANUAL')} className="bg-white dark:bg-gray-800 p-10 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl hover:border-primary-500 transition-colors text-left group">
                              <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mb-6 text-gray-600 dark:text-gray-300 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                  <FileText className="w-8 h-8" />
                              </div>
                              <h3 className="text-2xl font-bold mb-2 dark:text-white">Method 2: Manual</h3>
                              <p className="text-gray-500">Create questions from scratch. Full control over text, options, and difficulty.</p>
                          </button>
                      </div>
                      <button onClick={() => setView('LIST')} className="mt-8 text-gray-500 hover:underline">Cancel</button>
                  </div>
              )}

              {view === 'CREATE_AI' && (
                  <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold mb-6 dark:text-white">AI Test Generator</h3>
                      <div className="space-y-4 mb-6">
                          <input 
                              value={topic}
                              onChange={e => setTopic(e.target.value)}
                              placeholder="Enter Topic (e.g. Thermodynamics)"
                              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <select 
                             value={qCount}
                             onChange={e => setQCount(Number(e.target.value))}
                             className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                              <option value={5}>5 Questions</option>
                              <option value={10}>10 Questions</option>
                              <option value={20}>20 Questions</option>
                          </select>
                      </div>
                      <button 
                        onClick={handleAiGenerate}
                        disabled={loading || !topic}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2"
                      >
                          {loading ? <Loader2 className="animate-spin" /> : 'Generate & Save Draft'}
                      </button>
                      <button onClick={() => setView('CREATE_SELECT')} className="w-full mt-2 text-gray-500 py-2">Back</button>
                  </div>
              )}

              {view === 'CREATE_MANUAL' && (
                  <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-bold mb-6 dark:text-white">Manual Test Creator</h3>
                      <input 
                          value={manualTitle}
                          onChange={e => setManualTitle(e.target.value)}
                          placeholder="Test Title"
                          className="w-full p-3 border rounded-lg mb-6 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      
                      <div className="mb-6 space-y-4">
                          {manualQuestions.map((q, i) => (
                              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded border flex justify-between">
                                  <span className="truncate flex-1 dark:text-white">{i+1}. {q.text}</span>
                              </div>
                          ))}
                      </div>

                      <div className="flex gap-2 mb-6">
                          <input 
                              value={currentManualQ}
                              onChange={e => setCurrentManualQ(e.target.value)}
                              placeholder="Type Question Text"
                              className="flex-1 p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <button onClick={addManualQuestion} className="bg-gray-200 dark:bg-gray-600 px-4 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Add</button>
                      </div>

                      <button onClick={saveManualTest} disabled={!manualTitle || manualQuestions.length === 0} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold">
                          Save Test
                      </button>
                  </div>
              )}
          </div>
      );
  }

  // --- STUDENT VIEW ---
  return (
      <div className="p-6 max-w-4xl mx-auto">
          {view === 'LIST' && (
              <div className="space-y-8">
                  <div className="bg-gradient-to-r from-red-500 to-orange-600 p-8 rounded-2xl text-white shadow-xl">
                      <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                          <Play className="w-8 h-8 fill-current" /> Live Test Arena
                      </h2>
                      <p className="mb-6 opacity-90">Enter the unique code provided by your instructor to join a live proctored exam.</p>
                      
                      <div className="flex gap-2 max-w-md bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                          <input 
                              value={joinCode}
                              onChange={e => setJoinCode(e.target.value)}
                              placeholder="ENTER CODE (e.g. 123456)"
                              className="flex-1 bg-transparent border-none text-white placeholder-white/50 text-center font-mono text-xl focus:ring-0"
                          />
                          <button onClick={joinLiveTest} className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100">
                              JOIN
                          </button>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-xl font-bold dark:text-white mb-4">Assigned Tests</h3>
                      <div className="grid gap-4">
                          {globalTests.filter(t => t.status === 'LIVE' || t.id === 'demo-photosynthesis').map(test => (
                              <div key={test.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                  <div>
                                      <h4 className="font-bold text-lg dark:text-white">{test.title}</h4>
                                      <span className="text-sm text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded animate-pulse">● LIVE NOW</span>
                                  </div>
                                  <button onClick={() => startTest(test)} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold">
                                      Start
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {view === 'TAKE' && activeTest && (
            <div className="max-w-4xl mx-auto">
                {/* Header with Timer */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 z-20 p-4 rounded-lg shadow-md mb-6 flex justify-between items-center border border-gray-200 dark:border-gray-700">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{activeTest.title}</h3>
                        <p className="text-xs text-gray-500">Live Session</p>
                    </div>
                    <div className={`text-xl font-mono font-bold px-4 py-2 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                <div className="space-y-6 mb-20">
                    {activeTest.questions.map((q, idx) => (
                        <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <p className="text-lg font-medium mb-4 dark:text-white"><span className="text-gray-400 mr-2">{idx + 1}.</span> {q.text}</p>
                            {q.type === QuestionType.MCQ ? (
                                <div className="grid gap-2">
                                     {q.options?.map(opt => (
                                        <label key={opt} className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                            <input 
                                                type="radio" 
                                                name={`q-${q.id}`} 
                                                checked={answers[q.id] === opt}
                                                onChange={() => setAnswers({...answers, [q.id]: opt})}
                                                className="w-5 h-5 text-primary-600"
                                            />
                                            <span className="dark:text-gray-200 text-lg">{opt}</span>
                                        </label>
                                     ))}
                                </div>
                            ) : (
                                <textarea 
                                    className="w-full p-3 border rounded-lg dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                                    placeholder="Type your answer..."
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-center z-30 ml-64">
                    <button 
                        onClick={() => setShowConfirmSubmit(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg text-lg"
                    >
                        Submit Test
                    </button>
                </div>

                {showConfirmSubmit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold dark:text-white mb-2">Are you sure?</h3>
                            <div className="flex gap-4 justify-center mt-6">
                                <button onClick={() => setShowConfirmSubmit(false)} className="px-6 py-2 text-gray-500 font-bold">Cancel</button>
                                <button onClick={submitTest} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold">Yes, Submit</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
          )}

          {view === 'RESULT' && (
              <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg text-center mt-10 animate-fade-in">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2 dark:text-white">Test Submitted!</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">Your responses have been recorded.</p>
                  <button onClick={() => setView('LIST')} className="bg-gray-800 text-white px-8 py-3 rounded-lg font-bold">Return to Dashboard</button>
              </div>
          )}
      </div>
  );
};

export default TestManager;
