import React, { useState, useEffect } from 'react';
import { AppView, User, UserRole, LibraryItem, Classroom, TestData, TestResult, ContentType, Notification } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VideoGenerator from './components/VideoGenerator';
import EbookGenerator from './components/EbookGenerator';
import TestManager from './components/TestManager';
import DoubtTutor from './components/DoubtTutor';
import PPTGenerator from './components/PPTGenerator';
import ClassroomManager from './components/ClassroomManager';
import Library from './components/Library';
import SocialManager from './components/SocialManager';
import LearningPathBuilder from './components/LearningPathBuilder';
import ProfileManager from './components/ProfileManager';
import NotesGenerator from './components/NotesGenerator';
import AssignmentManager from './components/AssignmentManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { Loader2, Moon, Sun, Users, Mail, X } from 'lucide-react';
import { generateLearningPath, generateNotes, generateCareerPath } from './services/gemini';
import ReactMarkdown from 'react-markdown';
import { QuestionType } from './types';

// --- PLACEHOLDER COMPONENTS ---
const VirtualLab = () => <div className="p-10 text-center"><h2 className="text-2xl font-bold dark:text-white">🔬 Virtual Lab Simulator</h2><p className="text-gray-500 mt-2">Interactive experiments coming soon.</p></div>;
const CareerPath = () => {
    const [interest, setInterest] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 dark:text-white">Career Path Predictor</h2>
            <div className="flex gap-4 mb-6">
                <input value={interest} onChange={e=>setInterest(e.target.value)} placeholder="My interests (e.g. coding, biology, art)" className="flex-1 p-3 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-700"/>
                <button onClick={async ()=>{setLoading(true); setResult(await generateCareerPath(interest)); setLoading(false)}} className="bg-primary-600 text-white px-6 rounded">{loading ? '...' : 'Analyze'}</button>
            </div>
            {result && <div className="prose dark:prose-invert bg-white dark:bg-gray-800 p-6 rounded shadow"><ReactMarkdown>{result}</ReactMarkdown></div>}
        </div>
    )
};

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin }: { onLogin: (role: UserRole, email: string) => void }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">MyClassroom</h1>
                    <p className="text-gray-500">Your Intelligent Educational Platform</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[UserRole.STUDENT, UserRole.TEACHER].map((r) => (
                                <button 
                                    key={r} 
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${role === r ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                         <input 
                            type="email" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                         />
                    </div>

                    <button 
                        onClick={() => onLogin(role, email)}
                        disabled={!email}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        Enter Classroom
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- NOTIFICATION COMPONENT ---
const NotificationSystem = ({ notifications, remove }: { notifications: Notification[], remove: (id: string) => void }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {notifications.map(n => (
                <div key={n.id} className={`pointer-events-auto p-4 rounded-lg shadow-2xl border-l-4 flex items-start gap-3 w-80 animate-slide-in ${
                    n.type === 'EMAIL' ? 'bg-white text-gray-800 border-blue-500' : 
                    n.type === 'SUCCESS' ? 'bg-green-50 text-green-900 border-green-500' : 'bg-red-50 text-red-900 border-red-500'
                }`}>
                    {n.type === 'EMAIL' && <Mail className="w-5 h-5 text-blue-500 mt-1" />}
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">{n.title}</h4>
                        <p className="text-xs opacity-90">{n.message}</p>
                    </div>
                    <button onClick={() => remove(n.id)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                </div>
            ))}
        </div>
    )
}

// --- MAIN APP ---
const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Global "Database" State
    const [library, setLibrary] = useState<LibraryItem[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    
    // Initial Test Data (Demo)
    const [tests, setTests] = useState<TestData[]>([
        {
            id: 'demo-photosynthesis',
            title: 'Photosynthesis Practice Test',
            subject: 'Biology',
            creatorId: 'SYSTEM',
            status: 'LIVE',
            accessCode: '123456',
            settings: { timeLimitMinutes: 10, proctoring: false, adaptive: false, shuffleQuestions: false },
            questions: [
                { id: 1, text: 'Which pigment absorbs sunlight?', type: QuestionType.MCQ, options: ['Chlorophyll', 'Xanthophyll'], correctAnswer: 'Chlorophyll', explanation: '', difficulty: 'Easy' },
                { id: 2, text: 'Product of photosynthesis?', type: QuestionType.MCQ, options: ['O2', 'CO2'], correctAnswer: 'O2', explanation: '', difficulty: 'Easy' }
            ]
        }
    ]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    const addNotification = (title: string, message: string, type: 'INFO'|'SUCCESS'|'ERROR'|'EMAIL' = 'INFO') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, title, message, type, timestamp: new Date().toISOString() }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000); // Auto dismiss
    };

    const handleLogin = (role: UserRole, email: string) => {
        // Generate Mock ID
        const id = `MC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        setUser({
            id,
            email,
            name: email.split('@')[0],
            role,
            preferences: { language: 'English', gradeLevel: '10', style: 'Visual' },
            friends: [],
            profile: { dob: '', gender: '', school: '', phone: '', bio: '', isPublic: false }
        });
        setCurrentView(AppView.DASHBOARD);
    };

    const addToLibrary = (type: ContentType, title: string, data: any) => {
        const newItem: LibraryItem = {
            id: Date.now().toString(),
            type,
            title,
            dateCreated: new Date().toISOString(),
            data,
            userId: user?.id || ''
        };
        setLibrary(prev => [newItem, ...prev]);
        addNotification('Content Saved', `"${title}" added to My Library`, 'SUCCESS');
    };

    // SOCIAL LOGIC
    const handleSendRequest = (toUid: string) => {
        if (!user) return { success: false, message: 'Not logged in' };
        if (toUid === user.id) return { success: false, message: 'Cannot invite yourself' };
        
        // Demo Validation
        if (toUid.startsWith('MC-')) {
            setTimeout(() => {
                addNotification('New Notification', `${user.role === UserRole.TEACHER ? 'Student' : 'Friend'} accepted your request!`, 'SUCCESS');
                setUser(prev => prev ? ({ ...prev, friends: [...prev.friends, toUid] }) : null);
            }, 2000);
            return { success: true, message: 'Request sent successfully!' };
        } else {
            return { success: false, message: 'Invalid UID Format' };
        }
    };

    // CLASSROOM LOGIC
    const handleJoinClass = (code: string) => {
        if (code === 'SCI-10A' || code === 'PHY-101-MC123') {
             if (classrooms.find(c => c.code === code)) return { success: false, message: 'Already joined' };
             
             const newClass: Classroom = {
                 id: Date.now().toString(),
                 name: code === 'SCI-10A' ? 'Science Class 10' : 'Physics 101',
                 subject: 'Science',
                 teacherId: 'TEACHER',
                 studentIds: [user?.id || ''],
                 code: code
             };
             setClassrooms(prev => [...prev, newClass]);
             addNotification('Classroom Joined', `Welcome to ${newClass.name}!`, 'SUCCESS');
             return { success: true, message: `Joined ${newClass.name}!` };
        }
        return { success: false, message: 'Invalid Class Code' };
    };

    const handleCreateClass = (c: Classroom) => {
        setClassrooms(prev => [...prev, c]);
        addNotification('Classroom Created', `Code: ${c.code}`, 'SUCCESS');
    };

    const handleCreateTest = (t: TestData) => {
        setTests(prev => [...prev, t]);
        addNotification('Test Created', `Test "${t.title}" is now ${t.status}`, 'SUCCESS');
    };

    const renderContent = () => {
        if (!user) return null;
        switch (currentView) {
            case AppView.DASHBOARD: return <Dashboard user={user} changeView={setCurrentView} />;
            case AppView.VIDEO_GEN: return <VideoGenerator />;
            case AppView.EBOOK_GEN: return <EbookGenerator />;
            case AppView.PPT_GEN: return <PPTGenerator onSave={(ppt) => addToLibrary(ContentType.PPT, ppt.topic, ppt)} />;
            case AppView.TEST_MANAGER: return <TestManager user={user} globalTests={tests} testHistory={testResults.filter(r => r.studentId === user.id)} onAddTest={handleCreateTest} onSaveResult={(r) => { setTestResults([...testResults, r]); addNotification('Test Submitted', 'Results Awaited', 'SUCCESS'); }} />;
            case AppView.CLASSROOMS: return <ClassroomManager user={user} classrooms={classrooms} onCreate={handleCreateClass} onJoin={handleJoinClass} />;
            case AppView.LIBRARY: return <Library items={library.filter(i => i.userId === user.id)} />;
            case AppView.DOUBT_TUTOR: return <DoubtTutor />;
            case AppView.VIRTUAL_LAB: return <VirtualLab />;
            case AppView.CAREER_PATH: return <CareerPath />;
            case AppView.SOCIAL: return <SocialManager user={user} sendRequest={handleSendRequest} friends={user.friends} />;
            case AppView.LEARNING_PATH: return <LearningPathBuilder />;
            case AppView.NOTES_GEN: return <NotesGenerator onSave={(item) => addToLibrary(item.type!, item.title!, item.data)} />;
            case AppView.PROFILE: return <ProfileManager user={user} onUpdate={(u) => setUser(u)} />;
            case AppView.ASSIGNMENTS: return <AssignmentManager user={user} />;
            case AppView.ANALYTICS: return <AnalyticsDashboard />;
            default: return <div className="p-10">Feature coming soon</div>;
        }
    };

    if (!user) return <LoginScreen onLogin={handleLogin} />;

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans">
            <Sidebar currentView={currentView} onChangeView={setCurrentView} onLogout={() => setUser(null)} user={user} />
            <main className="flex-1 ml-64 relative">
                <div className="absolute top-4 right-4 z-20">
                    <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-yellow-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
                {renderContent()}
                <NotificationSystem notifications={notifications} remove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
            </main>
        </div>
    );
};

export default App;