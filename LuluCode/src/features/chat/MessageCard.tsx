import React, { useState } from 'react';
import { ChatMessage, useAgentStore } from '../../stores/useAgentStore';
import { ToolMessageCard } from './ToolMessageCard';
import { CodeBlock } from './CodeBlock';
import { FileReferenceLink } from './FileReferenceLink';
import { copyToClipboard } from '../../utils/clipboard';
import {
  User,
  Bot,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ListTodo,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Wrench,
} from 'lucide-react';

interface MessageCardProps {
  message: ChatMessage;
}

export const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const { startTask } = useAgentStore();

  const handleCopy = async () => {
    await copyToClipboard(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'TOOL') {
    return <ToolMessageCard msg={message} />;
  }

  // Parse markdown code blocks and inline file links
  const renderFormattedContent = (content: string) => {
    // 1. Separate by code blocks
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textSlice = content.slice(lastIndex, match.index);
        parts.push(renderInlineText(textSlice, `txt_${lastIndex}`));
      }
      const lang = match[1] || 'code';
      const code = match[2];
      parts.push(<CodeBlock key={`cb_${match.index}`} code={code} language={lang} />);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(renderInlineText(content.slice(lastIndex), `txt_${lastIndex}`));
    }

    return parts.length > 0 ? parts : renderInlineText(content, 'single');
  };

  const renderInlineText = (text: string, keyPrefix: string) => {
    // Match file paths like src/main.cpp:42 or include/player.hpp
    const fileRefRegex = /\b([a-zA-Z0-9_\-\.\/]+\.(?:cpp|cc|cxx|hpp|hh|c|h|rs|ts|tsx|js|jsx|py|json|toml|md|cmake|txt))(?::(\d+))?\b/g;
    const elements: React.ReactNode[] = [];
    let lastPos = 0;
    let match: RegExpExecArray | null;

    while ((match = fileRefRegex.exec(text)) !== null) {
      if (match.index > lastPos) {
        elements.push(
          <span key={`${keyPrefix}_str_${lastPos}`} className="whitespace-pre-wrap leading-relaxed select-text">
            {text.slice(lastPos, match.index)}
          </span>
        );
      }

      const filePath = match[1];
      const lineNum = match[2] ? parseInt(match[2], 10) : undefined;
      elements.push(
        <FileReferenceLink
          key={`${keyPrefix}_file_${match.index}`}
          filePath={filePath}
          line={lineNum}
        />
      );
      lastPos = match.index + match[0].length;
    }

    if (lastPos < text.length) {
      elements.push(
        <span key={`${keyPrefix}_str_${lastPos}`} className="whitespace-pre-wrap leading-relaxed select-text">
          {text.slice(lastPos)}
        </span>
      );
    }

    return <React.Fragment key={keyPrefix}>{elements}</React.Fragment>;
  };

  const isUser = message.role === 'USER';

  // Role visual hierarchy config
  const roleConfig = {
    USER: {
      avatarBg: 'bg-blue-600',
      icon: <User size={13} className="text-white" />,
      cardBg: 'bg-blue-600 text-white',
      borderColor: 'border-blue-500',
      badge: 'You',
    },
    ASSISTANT: {
      avatarBg: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
      icon: <Bot size={13} />,
      cardBg: 'bg-[#181b22] border border-[#2b313e] text-gray-200',
      borderColor: 'border-[#2b313e]',
      badge: 'Lulu Code',
    },
    LULU: {
      avatarBg: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
      icon: <Bot size={13} />,
      cardBg: 'bg-[#181b22] border border-[#2b313e] text-gray-200',
      borderColor: 'border-[#2b313e]',
      badge: 'Lulu Code',
    },
    SYSTEM: {
      avatarBg: 'bg-amber-600/20 text-amber-400 border border-amber-500/30',
      icon: <AlertTriangle size={13} />,
      cardBg: 'bg-amber-950/20 border border-amber-600/30 text-amber-200',
      borderColor: 'border-amber-600/30',
      badge: 'System Notice',
    },
    ERROR: {
      avatarBg: 'bg-red-600/20 text-red-400 border border-red-500/30',
      icon: <AlertCircle size={13} />,
      cardBg: 'bg-red-950/20 border border-red-500/40 text-red-200',
      borderColor: 'border-red-500/40',
      badge: 'Error',
    },
    WARNING: {
      avatarBg: 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30',
      icon: <AlertTriangle size={13} />,
      cardBg: 'bg-yellow-950/20 border border-yellow-500/30 text-yellow-200',
      borderColor: 'border-yellow-500/30',
      badge: 'Warning',
    },
    PERMISSION: {
      avatarBg: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
      icon: <ShieldAlert size={13} />,
      cardBg: 'bg-purple-950/20 border border-purple-500/40 text-purple-200',
      borderColor: 'border-purple-500/40',
      badge: 'Permission Required',
    },
    PLAN: {
      avatarBg: 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30',
      icon: <ListTodo size={13} />,
      cardBg: 'bg-cyan-950/15 border border-cyan-500/30 text-cyan-200',
      borderColor: 'border-cyan-500/30',
      badge: 'Execution Plan',
    },
    RESULT: {
      avatarBg: 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
      icon: <CheckCircle2 size={13} />,
      cardBg: 'bg-emerald-950/20 border border-emerald-500/40 text-emerald-200',
      borderColor: 'border-emerald-500/40',
      badge: 'Task Complete',
    },
  }[message.role] || {
    avatarBg: 'bg-gray-700 text-gray-200',
    icon: <Bot size={13} />,
    cardBg: 'bg-[#181b22] border border-[#2b313e] text-gray-200',
    borderColor: 'border-[#2b313e]',
    badge: message.role,
  };

  return (
    <div className={`group flex gap-3 text-[13.5px] leading-relaxed ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`w-7 h-7 rounded-lg ${roleConfig.avatarBg} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
          {roleConfig.icon}
        </div>
      )}

      <div className={`max-w-[88%] rounded-xl p-3.5 relative shadow-md ${roleConfig.cardBg}`}>
        {/* Header meta */}
        <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] opacity-75 select-none font-medium">
          <span className="font-semibold tracking-wide uppercase text-[10.5px]">
            {roleConfig.badge}
          </span>
          <span className="text-[10px] font-mono opacity-80">{message.timestamp}</span>
        </div>

        {/* Content */}
        <div className="space-y-1">
          {renderFormattedContent(message.content)}
        </div>

        {/* Action footer */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10.5px] opacity-60 group-hover:opacity-100 transition select-none">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition px-1 py-0.5 rounded hover:bg-white/10"
            title="Copy message"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {message.role === 'ERROR' && (
            <button
              onClick={() => startTask(`Fix this compiler/runtime error: ${message.content.slice(0, 120)}`)}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold transition px-1.5 py-0.5 rounded hover:bg-red-500/10"
            >
              <Wrench size={11} />
              <span>Fix Automatically</span>
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <User size={14} />
        </div>
      )}
    </div>
  );
};
