import React, { useState } from 'react';
import { FileNode } from '../../types/workspace';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useEditorStore } from '../../stores/useEditorStore';
import { invokeCommand } from '../../services/tauriBridge';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { rootPath, refreshFileTree } = useWorkspaceStore();
  const { openFile } = useEditorStore();

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'rs':
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
      case 'py':
      case 'go':
      case 'c':
      case 'cpp':
        return <FileCode size={14} className="text-cyan-400" />;
      case 'json':
      case 'toml':
      case 'yaml':
      case 'yml':
        return <FileText size={14} className="text-amber-400" />;
      case 'md':
        return <FileText size={14} className="text-blue-400" />;
      default:
        return <File size={14} className="text-gray-400" />;
    }
  };

  const handleClick = async () => {
    if (node.is_dir) {
      setIsOpen(!isOpen);
    } else {
      if (rootPath) {
        await openFile(rootPath, node.path);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rootPath) return;
    if (confirm(`Are you sure you want to delete ${node.name}?`)) {
      try {
        await invokeCommand('delete_file', { workspace: rootPath, path: node.path });
        await refreshFileTree();
      } catch (err) {
        alert(`Failed to delete: ${err}`);
      }
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className="group flex items-center justify-between py-1 pr-2 hover:bg-[#1f232d] cursor-pointer text-xs transition select-none text-gray-300 hover:text-gray-100"
      >
        <div className="flex items-center gap-1.5 truncate">
          {node.is_dir ? (
            <>
              {isOpen ? <ChevronDown size={12} className="text-gray-400 shrink-0" /> : <ChevronRight size={12} className="text-gray-400 shrink-0" />}
              {isOpen ? <FolderOpen size={14} className="text-blue-400 shrink-0" /> : <Folder size={14} className="text-blue-400 shrink-0" />}
            </>
          ) : (
            <>
              <span className="w-3" />
              {getFileIcon(node.name)}
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>

        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {node.is_dir && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const { fileTree, refreshFileTree, rootPath } = useWorkspaceStore();

  const handleCreateFile = async () => {
    if (!rootPath) return;
    const name = prompt('Enter new file name:');
    if (name) {
      try {
        await invokeCommand('create_file', { workspace: rootPath, path: name });
        await refreshFileTree();
      } catch (e) {
        alert(`Failed to create file: ${e}`);
      }
    }
  };

  const handleCreateFolder = async () => {
    if (!rootPath) return;
    const name = prompt('Enter new directory name:');
    if (name) {
      try {
        await invokeCommand('create_directory', { workspace: rootPath, path: name });
        await refreshFileTree();
      } catch (e) {
        alert(`Failed to create folder: ${e}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#14161d]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2b313e] text-xs font-semibold text-gray-400">
        <span>EXPLORER</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateFile}
            className="p-1 rounded hover:bg-[#1f232d] text-gray-400 hover:text-gray-200 transition"
            title="New File"
          >
            <Plus size={13} />
          </button>
          <button
            onClick={handleCreateFolder}
            className="p-1 rounded hover:bg-[#1f232d] text-gray-400 hover:text-gray-200 transition"
            title="New Folder"
          >
            <Folder size={13} />
          </button>
          <button
            onClick={() => refreshFileTree()}
            className="p-1 rounded hover:bg-[#1f232d] text-gray-400 hover:text-gray-200 transition"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">
            No files in workspace or folder not loaded.
          </div>
        ) : (
          fileTree.map((node) => <FileTreeItem key={node.path} node={node} depth={0} />)
        )}
      </div>
    </div>
  );
};
