import React, { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';
import { useEditorStore } from '../../stores/useEditorStore';
import { Code2, Copy, Check, GitCompare, Play } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filePath?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filePath }) => {
  const [copied, setCopied] = useState(false);
  const { showDiff, openFile } = useEditorStore();

  const handleCopy = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompare = () => {
    showDiff('', code);
  };

  return (
    <div className="my-2.5 rounded-lg border border-[#2b313e] bg-[#0c0e14] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161922] border-b border-[#2b313e] text-[11px] select-none">
        <div className="flex items-center gap-1.5">
          <Code2 size={12} className="text-cyan-400" />
          <span className="font-mono uppercase font-semibold text-cyan-300">
            {language || 'code'}
          </span>
          {filePath && (
            <span className="text-gray-500 font-mono text-[10px] ml-1">({filePath})</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCompare}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
            title="Compare Diff in Editor"
          >
            <GitCompare size={11} />
            <span>Diff</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-gray-400 hover:text-gray-200 hover:bg-white/10 transition"
            title="Copy Code"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <pre className="p-3.5 font-mono text-[12px] text-gray-200 overflow-x-auto whitespace-pre leading-relaxed select-text">
        {code}
      </pre>
    </div>
  );
};
