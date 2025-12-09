
import React from 'react';
import { AppView, User, UserRole } from '../types';
import { 
  Video, BookOpen, FileText, PenTool, Map, Users, UserPlus, 
  User as UserIcon, Bell, Settings, Plus, TrendingUp, Clock, 
  CheckSquare, PlayCircle
} from 'lucide-react';

interface DashboardProps {
  user: User;
  changeView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, changeView }) => {
  
  // STUDENT DASHBOARD CONFIG
  const studentStats = [
      { label: 'Study Hours', value: '14.2h', icon: Clock, color: 'text-blue-600 bg-blue-50' },
      { label: 'Avg Score', value: '88%', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
      { label: 'Assignments', value: '3 Pending', icon: FileText, color: 'text-orange-600 bg-orange-50' },
  ];

  const studentButtons = [
    { label: 'LIVE TEST', view: AppView.TEST_MANAGER, icon: PlayCircle, color: 'bg-red-600', sub: 'Join via Code' },
    { label: 'MY ASSIGNMENTS', view: AppView.ASSIGNMENTS, icon: FileText, color: 'bg-orange-600', sub: 'View Pending' },
    { label: 'MY CLASSROOMS', view: AppView.CLASSROOMS, icon: Users, color: 'bg-indigo-600', sub: 'View Classes' },
    { label: 'VIDEO TEACHER', view: AppView.VIDEO_GEN, icon: Video, color: 'bg-blue-600', sub: 'AI Generated' },
    { label: 'SMART NOTES', view: AppView.NOTES_GEN, icon: FileText, color: 'bg-green-600', sub: 'Revision' },
    { label: 'MY PROFILE', view: AppView.PROFILE, icon: UserIcon, color: 'bg-gray-600', sub: 'Settings' },
  ];

  // TEACHER DASHBOARD CONFIG
  const teacherStats = [
      { label: 'Active Classes', value: '4', icon: Users, color: 'text-purple-600 bg-purple-50' },
      { label: 'Live Tests', value: '1 Active', icon: PlayCircle, color: 'text-red-600 bg-red-50' },
      { label: 'Pending Reviews', value: '12', icon: CheckSquare, color: 'text-orange-600 bg-orange-50' },
  ];

  const teacherButtons = [
    { label: 'CREATE CLASSROOM', view: AppView.CLASSROOMS, icon: Plus, color: 'bg-blue-600', sub: 'New Batch' },
    { label: 'CREATE TEST', view: AppView.TEST_MANAGER, icon: PenTool, color: 'bg-purple-600', sub: 'AI or Manual' },
    { label: 'INVITE STUDENTS', view: AppView.SOCIAL, icon: UserPlus, color: 'bg-green-600', sub: 'Send Invites' },
    { label: 'ASSIGNMENTS', view: AppView.ASSIGNMENTS, icon: FileText, color: 'bg-teal-600', sub: 'Manage Work' },
    { label: 'ANALYTICS', view: AppView.ANALYTICS, icon: TrendingUp, color: 'bg-pink-600', sub: 'Results Sheet' }, 
    { label: 'MY PROFILE', view: AppView.PROFILE, icon: UserIcon, color: 'bg-gray-600', sub: 'Settings' },
  ];

  const buttons = user.role === UserRole.TEACHER ? teacherButtons : studentButtons;
  const stats = user.role === UserRole.TEACHER ? teacherStats : studentStats;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex justify-between items-end border-b pb-6 dark:border-gray-700">
        <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${user.role === UserRole.TEACHER ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                <UserIcon className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-3xl font-bold dark:text-white">
                    {user.role === UserRole.TEACHER ? 'Teacher Dashboard' : 'Student Dashboard'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Welcome back, {user.name}
                </p>
            </div>
        </div>
        <div className="text-right hidden md:block">
             <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">USER ID</span>
             <span className="font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm font-bold">{user.id}</span>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
                <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className={`p-4 rounded-full ${stat.color}`}>
                        <Icon className="w-6 h-6"/>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold dark:text-white">{stat.value}</p>
                    </div>
                </div>
            )
        })}
      </div>
      
      {/* Main Grid */}
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {buttons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              onClick={() => changeView(btn.view)}
              className={`${btn.color} hover:opacity-90 text-white rounded-xl p-6 shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl flex flex-col items-center justify-center gap-2 h-40 group relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Icon className="w-24 h-24" />
              </div>
              <div className="p-3 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors z-10">
                <Icon className="w-8 h-8" />
              </div>
              <span className="font-bold text-lg text-center z-10">{btn.label}</span>
              <span className="text-xs text-white/80 font-medium bg-black/20 px-2 py-0.5 rounded z-10">{btn.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
