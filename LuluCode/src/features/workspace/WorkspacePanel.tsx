import React, { useState } from 'react';
import { FileTree } from '../explorer/FileTree';
import { SearchPanel } from '../search/SearchPanel';
import { GitPanel } from '../git/GitPanel';
import { TaskHistoryList } from '../tasks/TaskHistoryList';
import { Files, Search, GitBranch, ListTodo } from 'lucide-react';

type SidebarTab = 'files' | 'search' | 'git' | 'tasks';

export const WorkspacePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>('files');

  return (
    <div className="flex h-full border-r border-[#2b313e] bg-[#14161d] shrink-0">
      {/* Activity Bar Icons */}
      <div className="w-12 bg-[#101217] border-r border-[#2b313e] flex flex-col items-center py-3 gap-3 select-none">
        <button
          onClick={() => setActiveTab('files')}
          className={`p-2 rounded-lg transition ${
            activeTab === 'files' ? 'text-blue-400 bg-[#1f232d]' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Explorer (Files)"
        >
          <Files size={18} />
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`p-2 rounded-lg transition ${
            activeTab === 'search' ? 'text-blue-400 bg-[#1f232d]' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Search"
        >
          <Search size={18} />
        </button>

        <button
          onClick={() => setActiveTab('git')}
          className={`p-2 rounded-lg transition ${
            activeTab === 'git' ? 'text-blue-400 bg-[#1f232d]' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Source Control (Git)"
        >
          <GitBranch size={18} />
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`p-2 rounded-lg transition ${
            activeTab === 'tasks' ? 'text-blue-400 bg-[#1f232d]' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Task History"
        >
          <ListTodo size={18} />
        </button>
      </div>

      {/* Selected Tab Content View */}
      <div className="w-64 h-full overflow-hidden">
        {activeTab === 'files' && <FileTree />}
        {activeTab === 'search' && <SearchPanel />}
        {activeTab === 'git' && <GitPanel />}
        {activeTab === 'tasks' && <TaskHistoryList />}
      </div>
    </div>
  );
};
