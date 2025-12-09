
import React, { useState } from 'react';
import { LibraryItem, ContentType } from '../types';
import { Video, BookOpen, FileText, Presentation, Trash2, Filter } from 'lucide-react';

interface LibraryProps {
  items: LibraryItem[];
}

const Library: React.FC<LibraryProps> = ({ items }) => {
  const [filter, setFilter] = useState<ContentType | 'ALL'>('ALL');

  const getIcon = (type: ContentType) => {
    switch (type) {
        case ContentType.VIDEO: return Video;
        case ContentType.EBOOK: return BookOpen;
        case ContentType.NOTES: return FileText;
        case ContentType.SMART_NOTE: return FileText;
        case ContentType.PPT: return Presentation;
        default: return FileText;
    }
  }

  const getFilteredItems = () => {
      if (filter === 'ALL') return items;
      return items.filter(i => i.type === filter);
  }

  const filteredItems = getFilteredItems();

  const tabs = [
      { id: 'ALL', label: 'All Content' },
      { id: ContentType.VIDEO, label: 'Videos' },
      { id: ContentType.EBOOK, label: 'Ebooks & Notes' },
      { id: ContentType.PPT, label: 'PPTs' },
      { id: ContentType.SMART_NOTE, label: 'Smart Notes' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">My Library</h2>
        
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-1">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`px-6 py-3 rounded-t-lg font-bold text-sm whitespace-nowrap transition-colors ${filter === tab.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
                const Icon = getIcon(item.type);
                return (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col group hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-lg ${
                                item.type === ContentType.VIDEO ? 'bg-blue-100 text-blue-600' :
                                item.type === ContentType.PPT ? 'bg-orange-100 text-orange-600' :
                                item.type === ContentType.SMART_NOTE ? 'bg-green-100 text-green-600' :
                                'bg-purple-100 text-purple-600'
                            }`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs text-gray-400 font-mono">{new Date(item.dateCreated).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">
                            {item.type.replace('_', ' ')}
                        </p>
                        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button className="flex-1 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors">Open</button>
                        </div>
                    </div>
                );
            })}
            {filteredItems.length === 0 && (
                <div className="col-span-3 text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Filter className="w-8 h-8"/>
                    </div>
                    <p className="text-gray-500 font-medium">No content found in this category.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Library;
