import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  Trash2, 
  Copy, 
  Check, 
  Square, 
  Sparkles, 
  Bot, 
  Brain, 
  ChevronDown, 
  Plus, 
  ArrowDown, 
  RotateCcw, 
  Terminal, 
  Code as CodeIcon,
  AlertCircle
} from 'lucide-react';
import { useLuluStore } from '../../stores/useLuluStore';
import { getConversations, getMessages, saveMessage, createConversation } from '../../services/storageService';
import { aiProviderManager } from '../../features/ai/AIProviderManager';
import { AiCliService, AiCliStatus } from '../../features/ai/AiCliService';
import { googleOAuthService, GoogleAccountProfile } from '../../services/googleOAuthService';
import { copyToClipboard } from '../../utils/clipboard';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    await copyToClipboard(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: '8px 0',
        backgroundColor: '#090D16',
        border: '1px solid var(--lulu-border, rgba(255, 122, 0, 0.4))',
        borderRadius: '8px',
        overflow: 'hidden',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 10px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          color: 'var(--lulu-accent, #00E5FF)',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CodeIcon size={12} />
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? '#10B981' : 'var(--lulu-muted, #94A3B8)',
            cursor: 'pointer',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 4px',
          }}
          title="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '10px',
          overflowX: 'auto',
          lineHeight: '1.45',
          color: '#F0F6FC',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
};

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
    character,
  } = useLuluStore();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const [activeProvider, setActiveProvider] = useState<string>('agy');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash-low');
  const [showModelPicker, setShowModelPicker] = useState<boolean>(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Google Account profile & OAuth status
  const [googleProfile, setGoogleProfile] = useState<GoogleAccountProfile | null>(
    googleOAuthService.getAccountProfile()
  );
  const [googleStatus, setGoogleStatus] = useState<string>(googleOAuthService.getStatus());
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isSyncingAccount, setIsSyncingAccount] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<string | null>(null);

  // AGY Interface status state
  const [agyInfo, setAgyInfo] = useState<AiCliStatus | null>(null);
  const [showAgyDrawer, setShowAgyDrawer] = useState(false);
  const [isTestingAgy, setIsTestingAgy] = useState(false);
  const [testAgyFeedback, setTestAgyFeedback] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const savedMessageIds = useRef<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const unsub = googleOAuthService.subscribe((status) => {
      setGoogleStatus(status);
      setGoogleProfile(googleOAuthService.getAccountProfile());
    });
    if (googleOAuthService.getStatus() !== 'CONNECTED') {
      googleOAuthService.syncLocalGoogleAccount().then((res) => {
        if (res.success && res.profile) {
          setGoogleProfile(res.profile);
          setGoogleStatus('CONNECTED');
        }
      });
    }
    return () => unsub();
  }, []);

  const handleSyncGoogle = async () => {
    setIsSyncingAccount(true);
    setAccountFeedback(null);
    try {
      const res = await googleOAuthService.syncLocalGoogleAccount();
      setAccountFeedback(res.message);
      if (res.profile) {
        setGoogleProfile(res.profile);
        setGoogleStatus('CONNECTED');
      }
    } catch (e: any) {
      setAccountFeedback(e?.message || 'Sync failed');
    } finally {
      setIsSyncingAccount(false);
      setTimeout(() => setAccountFeedback(null), 4000);
    }
  };

  const handleLoginGoogle = async () => {
    setIsSyncingAccount(true);
    try {
      const res = await googleOAuthService.connectGoogle();
      if (!res.success) {
        await handleSyncGoogle();
      }
    } finally {
      setIsSyncingAccount(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await googleOAuthService.disconnectGoogle();
    setGoogleProfile(null);
    setGoogleStatus('DISCONNECTED');
    setAccountFeedback('Disconnected Google account');
    setTimeout(() => setAccountFeedback(null), 3000);
  };

  useEffect(() => {
    if (chatOpen) {
      const ap = aiProviderManager.getActiveProviderId();
      setActiveProvider(ap);
      const cfg = aiProviderManager.getConfig(ap);
      if (cfg?.selectedModel) setSelectedModel(cfg.selectedModel);
      fetchAgyStatus();
    }
  }, [chatOpen]);

  const fetchAgyStatus = async () => {
    try {
      const status = await AiCliService.getProviderStatus('agy');
      if (status) {
        setAgyInfo(status);
        setProviderStatus(status.status === 'AUTHENTICATED' || status.status === 'INSTALLED' ? 'connected' : 'offline');
      }
    } catch {
      setProviderStatus('offline');
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkStatus = async () => {
      try {
        const activeId = aiProviderManager.getActiveProviderId();
        const provider = aiProviderManager.getProvider(activeId);
        if (provider && activeId !== 'offline') {
          const config = aiProviderManager.getConfig(activeId);
          const res = await provider.testConnection(config);
          if (mounted) setProviderStatus(res.success ? 'connected' : 'offline');
        } else {
          if (mounted) setProviderStatus('offline');
        }
      } catch {
        if (mounted) setProviderStatus('offline');
      }
    };

    if (chatOpen) {
      checkStatus();
      const interval = setInterval(checkStatus, 20000);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }
  }, [chatOpen]);

  // Load latest conversation history from SQLite
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    getConversations(1).then((convs) => {
      if (convs.length > 0) {
        const last = convs[0];
        setCurrentConversationId(last.id);
        getMessages(last.id, 50).then((msgs) => {
          if (msgs.length > 0) {
            const formatted = msgs.map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: m.timestamp,
            })).sort((a, b) => a.timestamp - b.timestamp);
            useLuluStore.setState({ chatMessages: formatted });
            formatted.forEach((m) => savedMessageIds.current.add(m.id));
          }
        });
      }
    });
  }, []);

  // Save messages to SQLite
  useEffect(() => {
    if (!currentConversationId) return;

    chatMessages.forEach((msg) => {
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

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setIsAtBottom(true);
    setUnreadCount(0);
  };

  // Auto-scroll when user is already at bottom
  useEffect(() => {
    if (!chatOpen) return;
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setUnreadCount((c) => c + 1);
    }
  }, [chatMessages, isGeneratingResponse, chatOpen]);

  const handleNewConversation = async () => {
    const newId = `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await createConversation(newId, 'New Conversation', 'local', 'default');
    setCurrentConversationId(newId);
    savedMessageIds.current.clear();
    const welcomeMsg = {
      id: `msg-${Date.now()}`,
      role: 'assistant' as const,
      content: character.id === 'madara_shinobi'
        ? "Wake up to reality! Madara Uchiha is on standby! 👁️ What shall we conquer today?"
        : character.id === 'naruto_shinobi'
          ? "Dattebayo! Naruto Uzumaki is on standby! 🍥 What's our next mission?"
          : "Hi there! I'm Lulu ✨ What are we working on together today?",
      timestamp: Date.now(),
    };
    useLuluStore.setState({ chatMessages: [welcomeMsg] });
    saveMessage(welcomeMsg.id, newId, welcomeMsg.role, welcomeMsg.content);
    savedMessageIds.current.add(welcomeMsg.id);
    scrollToBottom('auto');
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isGeneratingResponse) return;
    const text = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let convId = currentConversationId;
    if (!convId) {
      convId = `conv-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await createConversation(convId, 'New Conversation', 'local', 'default');
      setCurrentConversationId(convId);
    }

    scrollToBottom('smooth');
    sendChatMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSend();
    }
  };

  const handleCopy = async (id: string, text: string) => {
    await copyToClipboard(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = (msgIndex: number) => {
    // Find the preceding user message
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (chatMessages[i].role === 'user') {
        sendChatMessage(chatMessages[i].content);
        break;
      }
    }
  };

  const handleTestAgy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTestingAgy(true);
    setTestAgyFeedback(null);
    try {
      const res = await AiCliService.executeCli('agy', ['--version']);
      if (res.success || res.exitCode === 0) {
        setTestAgyFeedback(`✅ Connected to AGY v${res.stdout.trim() || '1.2.10'}`);
      } else {
        setTestAgyFeedback(`❌ Check returned: ${res.stderr || 'Command failed'}`);
      }
    } catch (err: any) {
      setTestAgyFeedback(`❌ Error: ${err?.message || String(err)}`);
    } finally {
      setIsTestingAgy(false);
      setTimeout(() => setTestAgyFeedback(null), 4000);
    }
  };

  const renderContentWithMarkdown = (content: string, msgId: string) => {
    // Split into code blocks vs regular markdown
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
        const lang = match ? match[1] || '' : '';
        const code = match ? match[2].trim() : part.slice(3, -3).trim();
        return <CodeBlock key={`${msgId}_code_${index}`} language={lang} code={code} />;
      }

      // Render bold & inline code
      const formattedLines = part.split('\n').map((line, lIdx) => {
        // Replace bold **text** with <strong>
        const boldParts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <div key={`line_${lIdx}`} style={{ minHeight: line ? 'auto' : '10px', margin: '2px 0' }}>
            {boldParts.map((bp, bIdx) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return (
                  <strong key={bIdx} style={{ color: 'var(--lulu-accent, #00E5FF)', fontWeight: 700 }}>
                    {bp.slice(2, -2)}
                  </strong>
                );
              }
              // Inline code `foo`
              const codeParts = bp.split(/(`.*?`)/g);
              return codeParts.map((cp, cIdx) => {
                if (cp.startsWith('`') && cp.endsWith('`')) {
                  return (
                    <code
                      key={cIdx}
                      style={{
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: 'var(--lulu-text, #FFF8F0)',
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {cp.slice(1, -1)}
                    </code>
                  );
                }
                return cp;
              });
            })}
          </div>
        );
      });

      return <React.Fragment key={`${msgId}_text_${index}`}>{formattedLines}</React.Fragment>;
    });
  };

  if (!chatOpen) return null;

  const isMadara = character.id === 'madara_shinobi' || character.tags?.includes('madara');
  const isNaruto = character.id === 'naruto_shinobi' || character.tags?.includes('naruto');

  const quickPrompts = isMadara
    ? [
        'Wake up to reality! What is our next battle plan? 👁️',
        'Analyze this code with the Mangekyo Sharingan ⚔️',
        'Unleash the Susanoo to build our application! 🌌',
        '/agent Summon an elite ninja strike team 🥷',
      ]
    : isNaruto
    ? [
        'Dattebayo! What is our next mission? 🍥',
        'Help me debug this code like a Hokage 🥷',
        'Explain this concept simply, believe it! ✨',
        '/timer 25 Ninja Focus sprint 🥷',
      ]
    : [
        'Help me debug some code',
        'Explain something fascinating',
        '/timer 25 Focus sprint',
        '/calc 15% of 240',
      ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: '10px',
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        backgroundColor: 'var(--lulu-bg, #0A0E17)',
        border: '1px solid var(--lulu-border, #FF7A00)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.65), 0 0 20px var(--lulu-glow, rgba(255, 122, 0, 0.25))',
        zIndex: 9998,
        overflow: 'hidden',
        fontSize: '13px',
        color: 'var(--lulu-text, #FFF8F0)',
      }}
      onClick={(e) => {
        setShowModelPicker(false);
        e.stopPropagation();
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: 'var(--lulu-panel, #131B2E)',
          borderBottom: '1px solid var(--lulu-border, #FF7A00)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: isMadara
                ? 'linear-gradient(135deg, #E11D48, #9F1239)'
                : isNaruto
                ? 'linear-gradient(135deg, #FF7A00, #E06A00)'
                : 'linear-gradient(135deg, #818CF8, #C084FC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              overflow: 'hidden',
            }}
          >
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : isMadara ? (
              '👁️'
            ) : isNaruto ? (
              '🍥'
            ) : (
              <Bot size={16} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{isMadara ? 'Madara Uchiha' : isNaruto ? 'Naruto Uzumaki' : 'Lulu'}</span>
              <span
                style={{
                  fontSize: '10px',
                  color: isMadara ? 'var(--lulu-primary, #E11D48)' : isNaruto ? 'var(--lulu-primary, #FF7A00)' : '#818CF8',
                }}
              >
                {isMadara ? '👁️ Ghost of Uchiha' : isNaruto ? '🍥 Dattebayo!' : '✨ AI Companion'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--lulu-muted, #94A3B8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Brain size={11} />
              <span>{isMadara ? 'Legendary Clan Leader' : isNaruto ? 'Seventh Hokage' : personality.name}</span>
            </div>
          </div>
        </div>

        {/* Model Quick Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowModelPicker(!showModelPicker);
            }}
            title="Switch AI Model & Engine"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: activeProvider === 'hybrid_gemini_agy' || activeProvider === 'agy' ? 'rgba(225, 29, 72, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${activeProvider === 'hybrid_gemini_agy' || activeProvider === 'agy' ? 'var(--lulu-border, #E11D48)' : 'rgba(255,255,255,0.15)'}`,
              color: activeProvider === 'hybrid_gemini_agy' ? '#38BDF8' : activeProvider === 'agy' ? 'var(--lulu-primary, #FF7A00)' : 'var(--lulu-text, #FFF8F0)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{activeProvider === 'hybrid_gemini_agy' ? '🔮 GEMINI+AGY' : activeProvider === 'agy' ? '🚀 GEMINI CLI' : activeProvider.toUpperCase()}: {selectedModel === 'auto' ? 'Auto-Route' : selectedModel.replace('gemini-', 'Gemini ').replace('-low', ' (Low)').replace('-high', ' (High)')}</span>
            <ChevronDown size={11} />
          </button>

          {showModelPicker && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                backgroundColor: 'var(--lulu-panel, #131B2E)',
                border: '1px solid var(--lulu-border, #FF7A00)',
                borderRadius: '12px',
                padding: '8px',
                zIndex: 10000,
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                minWidth: '250px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#38BDF8', padding: '2px 6px' }}>
                🔮 COMBINED GEMINI + AGY ENGINE
              </div>
              {[
                { id: 'auto', label: '⚡ Auto-Route (AGY CLI + Cloud Fallback)' },
                { id: 'gemini-1.5-flash', label: '✨ Google Gemini 1.5 Flash (Cloud API)' },
                { id: 'gemini-1.5-pro', label: '🌟 Google Gemini 1.5 Pro (Cloud API)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    aiProviderManager.setActiveProviderId('hybrid_gemini_agy');
                    aiProviderManager.updateConfig('hybrid_gemini_agy', { selectedModel: m.id });
                    setActiveProvider('hybrid_gemini_agy');
                    setSelectedModel(m.id);
                    setShowModelPicker(false);
                  }}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeProvider === 'hybrid_gemini_agy' && selectedModel === m.id ? 'var(--lulu-primary, #E11D48)' : 'transparent',
                    color: activeProvider === 'hybrid_gemini_agy' && selectedModel === m.id ? '#FFFFFF' : 'var(--lulu-text, #FFF8F0)',
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: activeProvider === 'hybrid_gemini_agy' && selectedModel === m.id ? 700 : 500,
                  }}
                >
                  {m.label}
                </button>
              ))}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--lulu-primary, #FF7A00)', padding: '2px 6px' }}>
                🚀 DEDICATED AGY CLI MODELS
              </div>
              {[
                { id: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low / Fast)' },
                { id: 'gemini-3.8-flash-high', label: 'Gemini 3.8 Flash (High / Smart)' },
                { id: 'gemini-3.7-flash-high', label: 'Gemini 3.7 Flash (High)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    aiProviderManager.setActiveProviderId('agy');
                    aiProviderManager.updateConfig('agy', { selectedModel: m.id });
                    setActiveProvider('agy');
                    setSelectedModel(m.id);
                    setShowModelPicker(false);
                  }}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeProvider === 'agy' && selectedModel === m.id ? 'var(--lulu-primary, #FF7A00)' : 'transparent',
                    color: activeProvider === 'agy' && selectedModel === m.id ? '#FFFFFF' : 'var(--lulu-text, #FFF8F0)',
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: activeProvider === 'agy' && selectedModel === m.id ? 700 : 500,
                  }}
                >
                  {m.label}
                </button>
              ))}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#38BDF8', padding: '2px 6px' }}>
                ✨ DIRECT GOOGLE GEMINI (CLOUD API)
              </div>
              {[
                { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    aiProviderManager.setActiveProviderId('gemini');
                    aiProviderManager.updateConfig('gemini', { selectedModel: m.id });
                    setActiveProvider('gemini');
                    setSelectedModel(m.id);
                    setShowModelPicker(false);
                  }}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activeProvider === 'gemini' && selectedModel === m.id ? '#38BDF8' : 'transparent',
                    color: activeProvider === 'gemini' && selectedModel === m.id ? '#000000' : 'var(--lulu-text, #FFF8F0)',
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: activeProvider === 'gemini' && selectedModel === m.id ? 700 : 500,
                  }}
                >
                  {m.label}
                </button>
              ))}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--lulu-muted, #94A3B8)', padding: '2px 6px' }}>
                OFFLINE FALLBACK
              </div>
              <button
                type="button"
                onClick={() => {
                  aiProviderManager.setActiveProviderId('offline');
                  setActiveProvider('offline');
                  setSelectedModel('built-in-rules');
                  setShowModelPicker(false);
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: activeProvider === 'offline' ? 'var(--lulu-primary, #FF7A00)' : 'transparent',
                  color: activeProvider === 'offline' ? '#FFFFFF' : 'var(--lulu-text, #FFF8F0)',
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                📦 Offline Rulebook
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Google Account Login / Status Badge */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowAccountModal(!showAccountModal);
              }}
              title={googleProfile ? `Google Account: ${googleProfile.email}` : 'Sign in with Google Account'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: googleStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${googleStatus === 'CONNECTED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                color: googleStatus === 'CONNECTED' ? '#10B981' : '#F59E0B',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {googleProfile?.avatarUrl ? (
                <img
                  src={googleProfile.avatarUrl}
                  alt="Google"
                  style={{ width: '13px', height: '13px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontWeight: 800, fontSize: '11px' }}>G</span>
              )}
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {googleProfile ? googleProfile.email.split('@')[0] : 'Login'}
              </span>
            </button>

            {showAccountModal && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  backgroundColor: 'var(--lulu-panel, #131B2E)',
                  border: '1px solid var(--lulu-border, #FF7A00)',
                  borderRadius: '12px',
                  padding: '12px',
                  zIndex: 10001,
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '230px',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {googleProfile?.avatarUrl ? (
                    <img
                      src={googleProfile.avatarUrl}
                      alt="Google"
                      style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                    />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                      G
                    </div>
                  )}
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {googleProfile?.displayName || 'Google Account'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94A3B8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {googleProfile?.email || 'Not connected'}
                    </div>
                  </div>
                </div>

                {accountFeedback && (
                  <div style={{ fontSize: '10px', color: '#38BDF8', padding: '2px 4px' }}>
                    {accountFeedback}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <button
                    type="button"
                    onClick={handleSyncGoogle}
                    disabled={isSyncingAccount}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: isSyncingAccount ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                    }}
                  >
                    <RotateCcw size={11} className={isSyncingAccount ? 'spin' : ''} />
                    <span>{isSyncingAccount ? 'Syncing...' : 'Sync Local Google Account'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoginGoogle}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #4285F4',
                      backgroundColor: 'rgba(66, 133, 244, 0.15)',
                      color: '#4285F4',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    Sign in with Google
                  </button>

                  {googleProfile && (
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                        fontSize: '10px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      Disconnect Account
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

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
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
        }}
      >
        {chatMessages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const timeStr = msg.timestamp
            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
          const isError = msg.content.startsWith('⚠️') || msg.content.startsWith('❌');

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  backgroundColor: isUser
                    ? 'var(--lulu-primary, #FF7A00)'
                    : 'var(--lulu-panel, #131B2E)',
                  color: isUser ? '#FFFFFF' : 'var(--lulu-text, #FFF8F0)',
                  border: isUser
                    ? 'none'
                    : isError
                    ? '1px solid #EF4444'
                    : '1px solid rgba(255, 122, 0, 0.3)',
                  padding: '9px 13px',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                  position: 'relative',
                  fontSize: '13px',
                }}
              >
                {msg.content ? (
                  renderContentWithMarkdown(msg.content, msg.id)
                ) : (
                  <span style={{ color: 'var(--lulu-muted, #94A3B8)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--lulu-primary, #FF7A00)', animation: 'pulse 1s infinite' }} />
                    Chakra thinking... 🍥
                  </span>
                )}

                {timeStr && (
                  <div
                    style={{
                      fontSize: '9.5px',
                      color: isUser ? 'rgba(255,255,255,0.7)' : 'var(--lulu-muted, #94A3B8)',
                      textAlign: 'right',
                      marginTop: '4px',
                    }}
                  >
                    {timeStr}
                  </div>
                )}
              </div>

              {!isUser && msg.content && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', paddingLeft: '4px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--lulu-muted, #94A3B8)',
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

                  {isError && (
                    <button
                      type="button"
                      onClick={() => handleRetry(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--lulu-primary, #FF7A00)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: 0,
                      }}
                    >
                      <RotateCcw size={11} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Suggestion pills if only welcome message exists */}
        {chatMessages.length <= 1 && (
          <div style={{ marginTop: '6px' }}>
            <div style={{ fontSize: '11px', color: 'var(--lulu-muted, #94A3B8)', marginBottom: '8px', fontWeight: 700, letterSpacing: '0.5px' }}>
              NINJA QUICK PROMPTS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendChatMessage(prompt)}
                  style={{
                    background: 'rgba(255, 122, 0, 0.08)',
                    border: '1px solid rgba(255, 122, 0, 0.25)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    textAlign: 'left',
                    color: 'var(--lulu-text, #FFF8F0)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={12} color="var(--lulu-primary, #FF7A00)" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Floating Scroll to Bottom Button */}
        {!isAtBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            style={{
              position: 'sticky',
              bottom: '10px',
              alignSelf: 'center',
              backgroundColor: 'var(--lulu-panel, #131B2E)',
              border: '1px solid var(--lulu-border, #FF7A00)',
              borderRadius: '20px',
              padding: '5px 12px',
              color: 'var(--lulu-text, #FFF8F0)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              zIndex: 10,
            }}
          >
            <ArrowDown size={12} />
            <span>Latest</span>
            {unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--lulu-primary, #FF7A00)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '9px',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--lulu-panel, #131B2E)',
          borderTop: '1px solid var(--lulu-border, #FF7A00)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder={isGeneratingResponse ? 'Lulu is formulating jutsu...' : 'Ask Lulu anything... (Enter to send, Shift+Enter for newline)'}
          disabled={isGeneratingResponse}
          style={{
            flex: 1,
            backgroundColor: 'var(--lulu-bg, #0A0E17)',
            border: '1px solid rgba(255, 122, 0, 0.4)',
            borderRadius: '10px',
            padding: '8px 12px',
            color: '#FFFFFF',
            fontSize: '13px',
            outline: 'none',
            resize: 'none',
            maxHeight: '90px',
            lineHeight: 1.4,
            fontFamily: 'inherit',
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
              marginBottom: '2px',
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
              backgroundColor: input.trim() ? 'var(--lulu-primary, #FF7A00)' : 'transparent',
              color: input.trim() ? '#FFFFFF' : 'var(--lulu-muted, #94A3B8)',
              cursor: input.trim() ? 'pointer' : 'default',
              marginBottom: '2px',
            }}
          >
            <Send size={15} />
          </button>
        )}
      </form>

      {/* Dedicated AGY CLI Interface Footer Bar */}
      <div
        style={{
          padding: '5px 12px',
          backgroundColor: 'var(--lulu-bg, #0A0E17)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: providerStatus === 'connected' ? '#10B981' : '#EF4444',
            }}
          />
          <span style={{ fontWeight: 600 }}>
            AGY: {providerStatus === 'connected' ? 'Connected' : 'Offline'}
          </span>
          {agyInfo?.version && (
            <span style={{ color: 'var(--lulu-muted, #94A3B8)', fontSize: '10px' }}>
              (v{agyInfo.version})
            </span>
          )}
          {testAgyFeedback && (
            <span style={{ fontSize: '10px', marginLeft: '4px', fontWeight: 600 }}>
              {testAgyFeedback}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleTestAgy}
            disabled={isTestingAgy}
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 122, 0, 0.15)',
              border: '1px solid var(--lulu-primary, #FF7A00)',
              color: 'var(--lulu-primary, #FF7A00)',
              fontSize: '10.5px',
              fontWeight: 600,
              cursor: isTestingAgy ? 'not-allowed' : 'pointer',
            }}
          >
            {isTestingAgy ? 'Checking...' : 'Test AGY'}
          </button>
          <button
            type="button"
            onClick={() => setShowAgyDrawer(!showAgyDrawer)}
            title="AGY CLI Diagnostics"
            style={{
              background: 'none',
              border: 'none',
              color: showAgyDrawer ? 'var(--lulu-primary, #FF7A00)' : 'var(--lulu-muted, #94A3B8)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            <Terminal size={13} />
          </button>
        </div>
      </div>

      {/* Expandable AGY Diagnostics Drawer */}
      {showAgyDrawer && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--lulu-panel, #131B2E)',
            borderTop: '1px solid var(--lulu-border, #FF7A00)',
            fontSize: '11px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--lulu-muted, #94A3B8)' }}>Binary Path:</span>
            <span style={{ fontFamily: 'monospace', color: '#00E5FF' }}>
              {agyInfo?.executablePath || '/home/reny/.local/bin/agy'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--lulu-muted, #94A3B8)' }}>Google Account:</span>
            <span style={{ color: '#10B981', fontWeight: 600 }}>rtnaeam611@gmail.com (Active)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--lulu-muted, #94A3B8)' }}>Model:</span>
            <span style={{ fontWeight: 600 }}>{selectedModel}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  borderRadius: '8px',
  width: '28px',
  height: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--lulu-muted, #94A3B8)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
