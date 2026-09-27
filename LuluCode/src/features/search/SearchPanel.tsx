import React, { useState } from 'react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { invokeCommand } from '../../services/tauriBridge';
import { SearchMatch } from '../../types/tools';
import { Search, Regex, FileText } from 'lucide-react';

export const SearchPanel: React.FC = () => {
  const { rootPath } = useWorkspaceStore();
  const { openFile } = useEditorStore();
  const [query, setQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootPath || !query.trim() || isSearching) return;
    setIsSearching(true);
    try {
      const matches = await invokeCommand<SearchMatch[]>('search_text', {
        workspace: rootPath,
        query: query.trim(),
        isRegex,
      });
      setResults(matches);
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = async (filePath: string) => {
    if (rootPath) {
      await openFile(rootPath, filePath);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#14161d] select-none text-xs">
      <div className="p-3 border-b border-[#2b313e]">
        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          WORKSPACE SEARCH
        </div>
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="flex items-center gap-1.5 bg-[#12141a] border border-[#2b313e] rounded-lg px-2.5 py-1.5">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in files..."
              className="flex-1 bg-transparent text-gray-100 outline-none placeholder:text-gray-600 text-xs"
            />
            <button
              type="button"
              onClick={() => setIsRegex(!isRegex)}
              className={`p-1 rounded transition ${
                isRegex ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              title="Use Regular Expression"
            >
              <Regex size={13} />
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {results.length === 0 ? (
          <div className="p-4 text-center text-gray-600 italic">
            {query ? 'No results found.' : 'Enter a query and press enter to search.'}
          </div>
        ) : (
          results.map((res, i) => (
            <div
              key={i}
              onClick={() => handleSelect(res.file_path)}
              className="p-2 rounded hover:bg-[#1f232d] cursor-pointer transition"
            >
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
                <FileText size={12} />
                <span className="truncate">{res.file_path}:{res.line_number}</span>
              </div>
              <p className="text-gray-400 font-mono text-[10px] mt-0.5 truncate pl-4">
                {res.line_content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
