import React, { useState } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Star, 
  Pin, 
  CheckCircle2,
  Tag
} from 'lucide-react';
import { MemoryCategory, MemoryItem } from '../../../features/memory/types';
import { memoryManager } from '../../../features/memory/MemoryManager';

export const MemoryTab: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>(memoryManager.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Add memory form state
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact');
  const [newImportance, setNewImportance] = useState(3);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshMemories = () => {
    setMemories(memoryManager.getAll());
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    memoryManager.remember(newKey, newValue, newCategory, newImportance);
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
    refreshMemories();
    showNotification('Memory stored safely in persistent local storage!');
  };

  const handleDelete = (id: string) => {
    memoryManager.forget(id);
    refreshMemories();
    showNotification('Memory erased.');
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to erase all stored memories? This cannot be undone.')) {
      memoryManager.clearAll();
      refreshMemories();
      showNotification('All memories cleared.');
    }
  };

  const handleExport = () => {
    const json = memoryManager.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lulu-memory-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exported memory backup JSON!');
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const filtered = memories.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', 'preference', 'fact', 'work', 'personal', 'topic'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818CF8', fontSize: '12px', fontWeight: 700 }}>
            <Database size={15} />
            <span>PERSISTENT MEMORY</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>Long-Term Memories</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #94A3B8)', marginTop: '2px' }}>
            Lulu remembers your preferences, project details, and key facts to personalize conversations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExport}
            style={actionBtnStyle}
            title="Export JSON Backup"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            style={{ ...actionBtnStyle, backgroundColor: 'var(--color-primary, #6366F1)', color: '#FFF' }}
          >
            <Plus size={14} />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            color: '#10B981',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Add Memory Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          style={{
            backgroundColor: 'var(--color-bg-card, #1E293B)',
            border: '1.5px solid #818CF8',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#818CF8' }}>Store New Persistent Memory</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Memory Key / Topic *</label>
              <input
                type="text"
                required
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. Favorite Language, Project Name..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                style={inputStyle}
              >
                <option value="fact">Fact</option>
                <option value="preference">Preference</option>
                <option value="work">Work & Tasks</option>
                <option value="personal">Personal</option>
                <option value="topic">Topic</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Memory Details / Value *</label>
            <textarea
              rows={2}
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. Loves TypeScript and builds high-performance offline desktop apps."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              style={{ ...actionBtnStyle, backgroundColor: 'transparent' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...actionBtnStyle, backgroundColor: '#818CF8', color: '#FFF' }}
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recalled memories..."
            style={{ ...inputStyle, paddingLeft: '34px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedCategory === cat ? '#818CF8' : 'var(--color-border, #334155)',
                backgroundColor: selectedCategory === cat ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: selectedCategory === cat ? '#818CF8' : 'var(--color-text-muted, #94A3B8)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memories List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted, #94A3B8)', fontSize: '13px' }}>
            No memories stored yet. Tell Lulu what to remember or click "Add Memory"!
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--color-bg-card, #1E293B)',
                border: '1px solid var(--color-border, #334155)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#F8FAFC' }}>
                    {item.key}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                      color: '#818CF8',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.category}
                  </span>
                  {item.pinned && <Pin size={12} color="#FBBF24" fill="#FBBF24" />}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)', lineHeight: 1.4 }}>
                  {item.value}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                title="Forget this memory"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted, #94A3B8)',
                  cursor: 'pointer',
                  padding: '6px',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {memories.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#EF4444',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Trash2 size={12} />
            <span>Clear All Memory</span>
          </button>
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--color-text-muted, #94A3B8)',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  backgroundColor: 'var(--color-bg, #0F172A)',
  border: '1px solid var(--color-border, #334155)',
  color: '#FFFFFF',
  fontSize: '12px',
  outline: 'none',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  backgroundColor: 'var(--color-bg-card, #1E293B)',
  border: '1px solid var(--color-border, #334155)',
  color: '#F8FAFC',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};
