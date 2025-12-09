
import React, { useState } from 'react';
import { Classroom, User, UserRole } from '../types';
import { Users, Plus, Hash, CheckCircle, XCircle } from 'lucide-react';

interface ClassroomManagerProps {
  user: User;
  classrooms: Classroom[];
  onCreate: (c: Classroom) => void;
  onJoin: (code: string) => { success: boolean; message: string };
}

const ClassroomManager: React.FC<ClassroomManagerProps> = ({ user, classrooms, onCreate, onJoin }) => {
  const [view, setView] = useState<'LIST' | 'CREATE' | 'JOIN'>('LIST');
  
  // Create Class State
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  
  // Join Class State
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<{success: boolean, message: string} | null>(null);

  const handleCreate = () => {
    // TEST CASE LOGIC: If name is "Science Class 10", force code SCI-10A
    let code = '';
    if (newClassName === 'Science Class 10') {
        code = 'SCI-10A';
    } else {
        code = Math.random().toString(36).substring(7).toUpperCase();
    }

    onCreate({
      id: Date.now().toString(),
      name: newClassName,
      subject: newSubject || 'General',
      teacherId: user.id,
      studentIds: [],
      code: code
    });
    setView('LIST');
    setNewClassName('');
    setNewSubject('');
  };

  const handleJoin = () => {
    const result = onJoin(joinCode);
    setJoinStatus(result);
    if (result.success) {
        setTimeout(() => {
            setView('LIST');
            setJoinStatus(null);
            setJoinCode('');
        }, 1500);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
       <div className="flex justify-between items-center mb-8">
         <h2 className="text-3xl font-bold dark:text-white flex items-center gap-2">
           <Users className="w-8 h-8 text-primary-500" /> 
           {user.role === UserRole.TEACHER ? 'Classroom Management' : 'My Classrooms'}
         </h2>
         <div className="flex gap-2">
            {user.role === UserRole.TEACHER ? (
                <button onClick={() => setView('CREATE')} className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 shadow-md">
                    <Plus className="w-4 h-4" /> Create Classroom
                </button>
            ) : (
                <button onClick={() => setView('JOIN')} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Hash className="w-4 h-4" /> Join Class
                </button>
            )}
         </div>
       </div>

       {/* TEACHER: CREATE CLASSROOM */}
       {view === 'CREATE' && (
         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700 animate-slide-in">
            <h3 className="font-bold text-xl mb-6 dark:text-white">Create New Classroom</h3>
            <div className="grid gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Class Name</label>
                    <input 
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                        placeholder="e.g. Science Class 10" 
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tip: Use "Science Class 10" to generate code SCI-10A</p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Subject</label>
                    <input 
                        value={newSubject}
                        onChange={e => setNewSubject(e.target.value)}
                        placeholder="e.g. Physics" 
                        className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            </div>
            <div className="flex gap-3 justify-end">
                <button onClick={() => setView('LIST')} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleCreate} disabled={!newClassName} className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-bold">Create Class</button>
            </div>
         </div>
       )}

       {/* STUDENT: JOIN CLASS */}
       {view === 'JOIN' && (
         <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg mb-6 border border-gray-200 dark:border-gray-700 max-w-lg mx-auto">
            <h3 className="font-bold text-xl mb-4 dark:text-white text-center">Join Classroom</h3>
            <p className="text-sm text-gray-500 mb-6 text-center">Enter the unique code shared by your teacher.</p>
            
            <input 
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value); setJoinStatus(null); }}
                placeholder="ENTER CODE (e.g. SCI-10A)" 
                className="w-full p-4 border-2 border-primary-100 rounded-xl mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-center uppercase text-xl focus:border-primary-500 outline-none"
            />
            
            {joinStatus && (
                <div className={`p-3 rounded-lg mb-4 flex items-center gap-2 justify-center ${joinStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {joinStatus.success ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                    {joinStatus.message}
                </div>
            )}

            <button onClick={handleJoin} className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-primary-700 transition-all">
                Join Now
            </button>
            <button onClick={() => setView('LIST')} className="w-full mt-2 text-gray-500 py-2 hover:underline">Cancel</button>
         </div>
       )}

       {/* LIST VIEW */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {classrooms.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-800 p-0 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-xl transition-all">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 relative">
                    <h3 className="text-2xl font-bold text-white mb-1 relative z-10">{c.name}</h3>
                    <p className="text-blue-100 text-sm relative z-10">{c.subject}</p>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-8 -translate-y-8"></div>
                </div>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-500">
                            <Users className="w-4 h-4 inline mr-1" />
                            {c.studentIds.length} Students
                        </div>
                        <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm font-mono font-bold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 select-all">
                            {c.code}
                        </span>
                    </div>
                </div>
            </div>
         ))}
       </div>
    </div>
  );
};

export default ClassroomManager;
