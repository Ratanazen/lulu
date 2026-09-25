import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Mic, 
  MicOff, 
  Square, 
  Sparkles, 
  Bot,
  Brain
} from 'lucide-react';
import { useLuluStore } from '../../stores/useLuluStore';
import { voiceManager } from '../../features/voice/VoiceManager';
import { getConversations, getMessages, saveMessage, createConversation } from '../../services/storageService';
import { Plus } from 'lucide-react';

export const CompactChatWindow: React.FC = () => {
  const {
    chatOpen,
    setChatOpen,
    chatMessages,
    isGeneratingResponse,
    sendChatMessage,
    cancelGeneration,
    clearChat,
    personality,
    voiceState,
  } = useLuluStore();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const savedMessageIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const { aiProviderManager } = await import('../../features/ai/AIProviderManager');
        const activeId = aiProviderManager.getActiveProviderId();
        const provider = aiProviderManager.getProvider(activeId);
        if (provider && activeId !== 'offline') {
          const config = aiProviderManager.getConfig(activeId);
          const res = await provider.testConnection(config);
          if (mounted) setProviderStatus(res.success ? 'connected' : 'offline');
        } else {
          if (mounted) setProviderStatus('offline');
        }
      } catch (e) {
        if (mounted) setProviderStatus('offline');
      }
    };

    if (chatOpen) {
      checkStatus();
      const interval = setInterval(checkStatus, 15000);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }
  }, [chatOpen]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    getConversations(1).then((convs) => {
      if (convs.length > 0) {
        const last = convs[0];
        setCurrentConversationId(last.id);
        getMessages(last.id, 50).then(msgs => {
          if (msgs.length > 0) {
            const formatted = msgs.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: m.timestamp
            })).sort((a, b) => a.timestamp - b.timestamp);
            useLuluStore.setState({ chatMessages: formatted });
            formatted.forEach(m => savedMessageIds.current.add(m.id));
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!currentConversationId) return;
    
    chatMessages.forEach(msg => {
      if (savedMessageIds.current.has(msg.id)) return;
      
      if (msg.role === 'user') {
        saveMessage(msg.id, currentConversationId, msg.role, msg.content);
        savedMessageIds.current.add(msg.id);
      } else if (msg.role === 'assistant' && !isGeneratingResponse && msg.content) {
        saveMessage(msg.id, currentConversationId, msg.role, msg.content);
        savedMessageIds.current.add(msg.id);
      }
    });
  }, [chatMessages, isGeneratingResponse, currentConversationId]);

  const handleNewConversation = async () => {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await createConversation(newId, 'New Conversation', 'local', 'default');
    setCurrentConversationId(newId);
    savedMessageIds.current.clear();
    const welcomeMsg = {
      id: `msg-${Date.now()}`,
      role: 'assistant' as const,
      content: "Hi there! I'm Lulu ✨ What are we working on together today?",
      timestamp: Date.now(),
    };
    useLuluStore.setState({ chatMessages: [welcomeMsg] });
    saveMessage(welcomeMsg.id, newId, welcomeMsg.role, welcomeMsg.content);
    savedMessageIds.current.add(welcomeMsg.id);
  };

  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen, isGeneratingResponse]);

  if (!chatOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGeneratingResponse) return;
    const text = input;
    setInput('');
    
    let convId = currentConversationId;
    if (!convId) {
      convId = `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await createConversation(convId, 'New Conversation', 'local', 'default');
      setCurrentConversationId(convId);
    }
    
    sendChatMessage(text);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleMic = () => {
    if (voiceState.isListening) {
      voiceManager.stopListening();
    } else {
      voiceManager.startListening();
    }
  };

  const quickPrompts = [
    'Help me debug some code',
    'Explain something fascinating',
    '/timer 25 Focus sprint',
    '/calc 15% of 240',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        width: '416px',
        maxWidth: 'calc(100vw - 24px)',
        height: '536px',
        maxHeight: 'calc(100vh - 24px)',
        backgroundColor: 'var(--color-bg, #0F172A)',
        border: '1px solid var(--color-border, #334155)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        zIndex: 9998,
        overflow: 'hidden',
        fontSize: '13px',
        color: 'var(--color-text, #F8FAFC)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          borderBottom: '1px solid var(--color-border, #334155)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #818CF8, #C084FC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
            }}
          >
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Lulu</span>
              <span style={{ fontSize: '10px', color: '#818CF8' }}>✨ AI Companion</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Brain size={11} />
              <span>{personality.name}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <kbd
            style={{
              padding: '2px 5px',
              fontSize: '9px',
              fontFamily: 'monospace',
              color: '#94A3B8',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '4px',
            }}
          >
            Ctrl+⇧+Space
          </kbd>
          <button
            type="button"
            onClick={handleNewConversation}
            title="New Conversation"
            style={iconBtnStyle}
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={clearChat}
            title="Clear conversation"
            style={iconBtnStyle}
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setChatOpen(false)}
            title="Close chat (Esc)"
            style={{
              ...iconBtnStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <X size={15} />
            <kbd
              style={{
                fontSize: '8px',
                fontFamily: 'monospace',
                color: '#94A3B8',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                padding: '1px 3px',
                borderRadius: '3px',
              }}
            >
              Esc
            </kbd>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {chatMessages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  backgroundColor: isUser
                    ? 'var(--color-primary, #6366F1)'
                    : 'var(--color-bg-card, #1E293B)',
                  color: isUser ? '#FFFFFF' : 'var(--color-text, #F8FAFC)',
                  border: isUser ? 'none' : '1px solid var(--color-border, #334155)',
                  padding: '10px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  position: 'relative',
                  fontSize: '13px',
                }}
              >
                {msg.content || (
                  <span style={{ color: 'var(--color-text-muted, #94A3B8)', fontStyle: 'italic' }}>
                    Thinking... ✨
                  </span>
                )}
              </div>

              {!isUser && msg.content && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', paddingLeft: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted, #94A3B8)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: 0,
                    }}
                  >
                    {copiedId === msg.id ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Suggestion pills if only welcome message exists */}
        {chatMessages.length <= 1 && (
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #94A3B8)', marginBottom: '8px', fontWeight: 600 }}>
              QUICK PROMPTS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendChatMessage(prompt)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    textAlign: 'left',
                    color: 'var(--color-text, #F8FAFC)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={12} color="#818CF8" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Status Pill if active */}
      {voiceState.isListening && (
        <div
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderTop: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1s infinite' }} />
          <span>Listening... {voiceState.transcript || 'Speak now into microphone'}</span>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '10px 12px',
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          borderTop: '1px solid var(--color-border, #334155)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={toggleMic}
          title={voiceState.isListening ? 'Stop Listening' : 'Voice Input (Push to Talk)'}
          style={{
            ...iconBtnStyle,
            color: voiceState.isListening ? '#EF4444' : 'var(--color-text-muted, #94A3B8)',
          }}
        >
          {voiceState.isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isGeneratingResponse ? 'Lulu is typing...' : 'Ask Lulu anything... (/calc, /timer)'}
          disabled={isGeneratingResponse}
          style={{
            flex: 1,
            backgroundColor: 'var(--color-bg, #0F172A)',
            border: '1px solid var(--color-border, #334155)',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#FFFFFF',
            fontSize: '13px',
            outline: 'none',
          }}
        />

        {isGeneratingResponse ? (
          <button
            type="button"
            onClick={cancelGeneration}
            title="Stop generation"
            style={{
              ...iconBtnStyle,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
            }}
          >
            <Square size={14} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              ...iconBtnStyle,
              backgroundColor: input.trim() ? 'var(--color-primary, #6366F1)' : 'transparent',
              color: input.trim() ? '#FFFFFF' : 'var(--color-text-muted, #94A3B8)',
              cursor: input.trim() ? 'pointer' : 'default',
            }}
          >
            <Send size={15} />
          </button>
        )}
      </form>
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  borderRadius: '8px',
  width: '30px',
  height: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-muted, #94A3B8)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
