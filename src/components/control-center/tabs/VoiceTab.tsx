import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Mic, 
  Play, 
  Square, 
  Settings2, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { voiceManager } from '../../../features/voice/VoiceManager';
import { VoiceSettings } from '../../../features/voice/types';

export const VoiceTab: React.FC = () => {
  const [settings, setSettings] = useState<VoiceSettings>(voiceManager.getSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTestingSpeech, setIsTestingSpeech] = useState(false);

  useEffect(() => {
    const updateVoices = () => {
      const v = voiceManager.getAvailableVoices();
      setAvailableVoices(v);
      if (!settings.selectedVoiceUri && v.length > 0) {
        handleSettingChange({ selectedVoiceUri: v[0].voiceURI });
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const handleSettingChange = (partial: Partial<VoiceSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    voiceManager.updateSettings(partial);
  };

  const handleTestSpeech = async () => {
    setIsTestingSpeech(true);
    await voiceManager.speak("Hello! I'm Lulu, your AI companion. My voice is ready and working perfectly! ✨");
    setIsTestingSpeech(false);
  };

  const handleStopSpeech = async () => {
    await voiceManager.stopSpeaking();
    setIsTestingSpeech(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#818CF8', fontSize: '12px', fontWeight: 700 }}>
          <Volume2 size={15} />
          <span>VOICE & SPEECH SYNTHESIS</span>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>Speech Engine & Audio</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #94A3B8)', marginTop: '2px' }}>
          Configure text-to-speech voice models, pitch, and speech playback speed.
        </p>
      </div>

      {/* Main Settings Card */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-card, #1E293B)',
          border: '1px solid var(--color-border, #334155)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Master Toggles */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--color-border, #334155)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Enable Voice Audio</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)' }}>
              Play synthesized voice audio when Lulu speaks
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleSettingChange({ enabled: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: '#818CF8', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--color-border, #334155)' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Auto-Speak AI Responses</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #94A3B8)' }}>
              Automatically read chat replies out loud
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoSpeak}
            onChange={(e) => handleSettingChange({ autoSpeak: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: '#818CF8', cursor: 'pointer' }}
          />
        </div>

        {/* Voice Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted, #94A3B8)', marginBottom: '6px' }}>
            System Voice Model
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              value={settings.selectedVoiceUri}
              onChange={(e) => handleSettingChange({ selectedVoiceUri: e.target.value })}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-bg, #0F172A)',
                border: '1px solid var(--color-border, #334155)',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
              }}
            >
              {availableVoices.length === 0 ? (
                <option value="">Default System Voice</option>
              ) : (
                availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={handleTestSpeech}
              disabled={isTestingSpeech}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid #818CF8',
                color: '#818CF8',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isTestingSpeech ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Play size={14} />
              <span>{isTestingSpeech ? 'Speaking...' : 'Test Voice'}</span>
            </button>

            <button
              type="button"
              onClick={handleStopSpeech}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Stop voice output immediately"
            >
              <Square size={13} />
              <span>Stop Voice</span>
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Volume</span>
              <span style={{ color: '#818CF8', fontWeight: 700 }}>{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.volume}
              onChange={(e) => handleSettingChange({ volume: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#818CF8' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Pitch</span>
              <span style={{ color: '#818CF8', fontWeight: 700 }}>{settings.pitch}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => handleSettingChange({ pitch: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#818CF8' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600 }}>Speed (Rate)</span>
              <span style={{ color: '#818CF8', fontWeight: 700 }}>{settings.rate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.8"
              step="0.1"
              value={settings.rate}
              onChange={(e) => handleSettingChange({ rate: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#818CF8' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
