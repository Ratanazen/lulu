import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { FileCode2 } from 'lucide-react';

interface FileReferenceLinkProps {
  filePath: string;
  line?: number;
  label?: string;
}

export const FileReferenceLink: React.FC<FileReferenceLinkProps> = ({ filePath, line, label }) => {
  const { openFile } = useEditorStore();
  const { rootPath } = useWorkspaceStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rootPath) {
      openFile(rootPath, filePath);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 font-mono text-[11.5px] border border-blue-500/30 transition select-none cursor-pointer"
      title={`Open ${filePath}${line ? ` at line ${line}` : ''}`}
    >
      <FileCode2 size={11} className="text-blue-400 shrink-0" />
      <span>{label || (line ? `${filePath}:${line}` : filePath)}</span>
    </button>
  );
};
