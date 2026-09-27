import React, { useState, useEffect } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { copyToClipboard } from '../../utils/clipboard';
import { X, FileCode, Check, Save, Copy, FileText } from 'lucide-react';

export const CodeEditor: React.FC = () => {
  const {
    tabs,
    activePath,
    setActiveTab,
    closeTab,
    updateContent,
    saveFile,
    diffMode,
    diffOriginal,
    diffModified,
    closeDiff,
  } = useEditorStore();

  const { rootPath } = useWorkspaceStore();
  const currentTab = tabs.find((t) => t.path === activePath);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedDiff, setCopiedDiff] = useState(false);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (rootPath && activePath) {
          saveFile(rootPath, activePath);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rootPath, activePath, saveFile]);

  const handleCopyCode = async () => {
    if (!currentTab) return;
    await copyToClipboard(currentTab.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyPath = async () => {
    if (!currentTab) return;
    await copyToClipboard(currentTab.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleCopyDiff = async () => {
    const diffText = `--- Original\n+++ Proposed\n${diffModified}`;
    await copyToClipboard(diffText);
    setCopiedDiff(true);
    setTimeout(() => setCopiedDiff(false), 2000);
  };

  if (diffMode) {
    return (
      <div className="flex flex-col h-full bg-[#12141a]">
        <div className="h-9 bg-[#181b22] border-b border-[#2b313e] flex items-center justify-between px-3">
          <span className="text-xs font-medium text-amber-400">Diff Preview (Original vs Proposed)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDiff}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1f232d] hover:bg-[#2a303d] text-xs text-gray-300 transition"
              title="Copy Unified Diff"
            >
              {copiedDiff ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedDiff ? 'Copied Diff' : 'Copy Diff'}</span>
            </button>
            <button
              onClick={closeDiff}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-xs text-blue-300 transition"
            >
              <Check size={12} /> Done
            </button>
          </div>
        </div>
        <div className="flex-1">
          <DiffEditor
            original={diffOriginal}
            modified={diffModified}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              renderSideBySide: true,
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>
    );
  }

  if (tabs.length === 0 || !currentTab) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#12141a] text-gray-500 text-xs">
        <div className="w-12 h-12 rounded-xl bg-[#181b22] border border-[#2b313e] flex items-center justify-center text-gray-400 mb-3 shadow">
          <FileCode size={24} />
        </div>
        <p className="font-medium text-gray-400">No file open</p>
        <p className="text-[11px] text-gray-600 mt-1">Select a file from the explorer or ask Lulu to inspect the repository</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#12141a]">
      {/* Tabs Bar */}
      <div className="h-9 bg-[#14161d] border-b border-[#2b313e] flex items-center justify-between overflow-x-auto select-none">
        <div className="flex items-center h-full">
          {tabs.map((tab) => {
            const isActive = tab.path === activePath;
            return (
              <div
                key={tab.path}
                onClick={() => setActiveTab(tab.path)}
                className={`h-full flex items-center gap-2 px-3 border-r border-[#2b313e] text-xs cursor-pointer transition ${
                  isActive
                    ? 'bg-[#12141a] text-gray-100 border-t-2 border-t-blue-500 font-medium'
                    : 'bg-[#181b22]/70 text-gray-400 hover:bg-[#181b22] hover:text-gray-200'
                }`}
              >
                <span>{tab.name}</span>
                {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Unsaved changes" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.path);
                  }}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Toolbar on Right */}
        <div className="flex items-center gap-1.5 pr-3">
          <button
            onClick={handleCopyPath}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-[#1f232d] text-gray-400 hover:text-gray-200 transition"
            title="Copy File Path"
          >
            {copiedPath ? <Check size={11} className="text-emerald-400" /> : <FileText size={11} />}
            <span>{copiedPath ? 'Path Copied' : 'Copy Path'}</span>
          </button>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-[#1f232d] text-gray-400 hover:text-gray-200 transition"
            title="Copy Code to Clipboard"
          >
            {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copiedCode ? 'Code Copied' : 'Copy Code'}</span>
          </button>

          {currentTab.isDirty && (
            <button
              onClick={() => rootPath && saveFile(rootPath, currentTab.path)}
              className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 transition font-medium"
              title="Save (Ctrl+S)"
            >
              <Save size={11} /> Save
            </button>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={currentTab.language}
          value={currentTab.content}
          theme="vs-dark"
          onChange={(val) => updateContent(currentTab.path, val || '')}
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};
