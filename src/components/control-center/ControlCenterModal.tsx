import React, { useState, useEffect } from 'react';
import {
  PetNeeds,
  MoodType,
  PetPreferences,
  NativeMonitorInfo,
  CharacterStyle,
  SystemTelemetry,
  BehaviorMode,
} from '../../types/pet';
import { LULU_THEMES } from '../../themes';
import { invokeCommand } from '../../services/tauriBridge';
import { LyricsViewer } from '../../features/lyrics/LyricsViewer';
import { LrcParser, ParsedLrc } from '../../features/lyrics/lrcParser';
import { messageManager } from '../../services/messageManager';
import {
  X,
  Activity,
  Heart,
  Bell,
  Music,
  Sliders,
  Monitor,
  Shield,
  Stethoscope,
  Info,
  Sparkles,
  Coffee,
  Moon,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Volume2,
  Zap,
  Unlock,
  CheckSquare,
  Search,
  Mic,
  Cpu,
  Battery,
  Laptop,
} from 'lucide-react';
import { LULU_FLAME_STYLES, LULU_TASKS, FLAME_SPEED_PRESETS } from '../../config/luluFlameConfig';
import { spotifyLyricsService, LyricsSearchResult } from '../../features/lyrics/spotifyLyricsService';
import shinobiIdle from '../../assets/avatars/shinobi_idle.png';
import shinobiRun from '../../assets/avatars/shinobi_run.png';
import shinobiHappy from '../../assets/avatars/shinobi_happy.png';
import shinobiSleep from '../../assets/avatars/shinobi_sleep.png';
import shinobiSing from '../../assets/avatars/shinobi_sing.png';
import shinobiSad from '../../assets/avatars/shinobi_sad.png';
import shinobiProtect from '../../assets/avatars/shinobi_protect.png';
import shinobiSitdown from '../../assets/avatars/shinobi_sitdown.png';

export const getTaskImage = (imageKey?: string) => {
  switch (imageKey) {
    case 'run':
      return shinobiRun;
    case 'happy':
      return shinobiHappy;
    case 'sleep':
      return shinobiSleep;
    case 'sing':
      return shinobiSing;
    case 'sad':
      return shinobiSad;
    case 'protect':
      return shinobiProtect;
    case 'sit':
      return shinobiSitdown;
    case 'idle':
    default:
      return shinobiIdle;
  }
};

export const getFlameImage = (id: string) => {
  switch (id) {
    case 'sprint_dash':
    case 'desktop_patrol':
      return shinobiRun;
    case 'spotify_sing':
    case 'spotify_dance':
      return shinobiSing;
    case 'celebration_cheer':
      return shinobiHappy;
    case 'peaceful_rest':
      return shinobiSleep;
    case 'step_down_rest':
    case 'step_down_zen_posture':
      return shinobiSitdown;
    case 'deep_contemplate':
      return shinobiSad;
    case 'susanoo_defense':
    case 'ninja_salute':
      return shinobiProtect;
    default:
      return shinobiIdle;
  }
};

export const SHINOBI_SPRITES = [
  { id: 'idle', name: 'Idle Guard', image: shinobiIdle, badge: 'Standard', desc: 'Standing guard stance with breathing animation' },
  { id: 'run', name: 'Ninja Sprint', image: shinobiRun, badge: 'Sprint / Run', desc: 'High-speed desktop traversal sprint pose' },
  { id: 'happy', name: 'Joyous Cheer', image: shinobiHappy, badge: 'Celebration', desc: 'Victorious cheer with glowing aura & hearts' },
  { id: 'sleep', name: 'Deep Slumber', image: shinobiSleep, badge: 'Authentic Sleep', desc: 'Lying comfortably on floor with floating Zzz bubbles' },
  { id: 'sit', name: 'Step Down / Sit', image: shinobiSitdown, badge: 'Relaxed Sit', desc: 'Calm cross-legged floor posture resting peacefully' },
  { id: 'sing', name: 'Karaoke Sing', image: shinobiSing, badge: 'Spotify Sync', desc: 'Stage microphone & floating musical rhythm notes' },
  { id: 'sad', name: 'Contemplate', image: shinobiSad, badge: 'Solitude', desc: 'Seated contemplation with tear & comforting aura' },
  { id: 'protect', name: 'Flame Shield', image: shinobiProtect, badge: 'Susanoo Barrier', desc: 'Chakra hand seal with cyan flame barrier' },
];

export const ALL_BEHAVIOR_MODES: {
  id: BehaviorMode;
  label: string;
  desc: string;
  icon: string;
  badge: string;
}[] = [
  { id: 'SYSTEM_SYNC', label: 'Follow System', desc: 'Syncs with computer CPU load & battery in real-time', icon: '💻', badge: 'Telemetry' },
  { id: 'ACTIVE', label: 'Active Traversal', desc: 'Continuous desktop patrol and high-speed sprint', icon: '🏃', badge: 'Continuous' },
  { id: 'PLAYFUL', label: 'Playful Cheer', desc: 'Frequent katas, dances, and affection routines', icon: '🎮', badge: 'High Energy' },
  { id: 'NORMAL', label: 'Balanced Normal', desc: 'Classic lifelike desktop companion behavior', icon: '🐾', badge: 'Default' },
  { id: 'CALM', label: 'Calm & Restful', desc: 'Slow strolls, quiet rests, and gentle breathing', icon: '🧘', badge: 'Relaxed' },
  { id: 'FOCUSED', label: 'Focused Study', desc: 'Stays still next to your window while you work', icon: '🎯', badge: 'Focus' },
  { id: 'QUIET', label: 'Quiet Muted', desc: 'Completely stationary and silent guard', icon: '🤫', badge: 'Muted' },
];

interface ControlCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  needs: PetNeeds;
  mood: MoodType;
  preferences: PetPreferences;
  onUpdatePreferences: (pref: PetPreferences) => void;
  onPetLulu: () => void;
  onFeedSnack: () => void;
  onToggleSleep: () => void;
  isSleeping: boolean;
  onSendLove?: () => void;
  onTriggerAnimation?: (anim: string) => void;
  onTriggerFocusEvent?: () => void;
  focusIntervalSeconds?: number;
  onSetFocusInterval?: (secs: number) => void;
  isContinuousRunning?: boolean;
  onToggleContinuousRun?: () => void;
  is40sRunActive?: boolean;
  onStart40sRun?: () => void;
  parsedLrc?: ParsedLrc | null;
  onStopMovement?: () => void;
  onPauseMovement?: () => void;
  onResumeMovement?: () => void;
  isMovementPaused?: boolean;
  currentDirection?: 'left' | 'right' | 'idle';
  currentFrame?: number;
  showText?: boolean;
  onToggleShowText?: () => void;
  speedMultiplier?: number;
  onSetSpeedMultiplier?: (mult: number) => void;
  onUnlockAll?: () => void;
  systemTelemetry?: SystemTelemetry | null;
}

type TabType =
  | 'show_all'
  | 'overview'
  | 'tasks'
  | 'pet'
  | 'notifications'
  | 'music_lyrics'
  | 'movement_monitors'
  | 'privacy_storage'
  | 'diagnostics_about';

export const ControlCenterModal: React.FC<ControlCenterModalProps> = ({
  isOpen,
  onClose,
  needs,
  mood,
  preferences,
  onUpdatePreferences,
  onPetLulu,
  onFeedSnack,
  onToggleSleep,
  isSleeping,
  onSendLove,
  onTriggerAnimation,
  onTriggerFocusEvent,
  focusIntervalSeconds = 40,
  onSetFocusInterval,
  isContinuousRunning = false,
  onToggleContinuousRun,
  is40sRunActive = false,
  onStart40sRun,
  parsedLrc: externalParsedLrc = null,
  onStopMovement,
  onPauseMovement,
  onResumeMovement,
  isMovementPaused = false,
  currentDirection = 'idle',
  currentFrame = 0,
  showText = true,
  onToggleShowText,
  speedMultiplier = 1.0,
  onSetSpeedMultiplier,
  onUnlockAll,
  systemTelemetry = null,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('show_all');

  // Diagnostics & Capabilities
  const [capabilities, setCapabilities] = useState<any>(null);
  const [doctorReport, setDoctorReport] = useState<any>(null);
  const [isDoctorRunning, setIsDoctorRunning] = useState(false);

  // Monitors
  const [monitors, setMonitors] = useState<NativeMonitorInfo[]>([]);

  // Music & Lyrics
  const [musicStatus, setMusicStatus] = useState<any>(null);
  const [localLyricsFiles, setLocalLyricsFiles] = useState<any[]>([]);
  const [parsedLrc, setParsedLrc] = useState<ParsedLrc | null>(externalParsedLrc);
  const [selectedLrcContent, setSelectedLrcContent] = useState<string>('');
  const [customLrcText, setCustomLrcText] = useState('');

  useEffect(() => {
    if (externalParsedLrc) {
      setParsedLrc(externalParsedLrc);
    }
  }, [externalParsedLrc]);

  // Notifications
  const [notifSettings, setNotifSettings] = useState<any>({
    listener_enabled: true,
    show_app_name: true,
    show_title: true,
    show_body: false,
    sound: false,
    privacy_mode: true,
  });
  const [notifHistory, setNotifHistory] = useState<any[]>([]);
  const [testApp, setTestApp] = useState('Telegram');
  const [testTitle, setTestTitle] = useState('New message from Team');

  // Spotify / Lyrics API Search & Sync Offset
  const [lyricsSearchQuery, setLyricsSearchQuery] = useState('');
  const [lyricsSearchResults, setLyricsSearchResults] = useState<LyricsSearchResult[]>([]);
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
  const [lyricsSyncOffset, setLyricsSyncOffset] = useState(spotifyLyricsService.getSyncOffset());

  // Load capabilities & monitors when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const caps = await invokeCommand<any>('get_capabilities');
        if (caps) setCapabilities(caps);

        const mons = await invokeCommand<NativeMonitorInfo[]>('get_monitors');
        if (mons) setMonitors(mons);

        const music = await invokeCommand<any>('get_music_status');
        if (music) setMusicStatus(music);

        const nSettings = await invokeCommand<any>('get_notification_settings');
        if (nSettings) setNotifSettings(nSettings);

        const nHist = await invokeCommand<any[]>('get_notification_history', { limit: 20 });
        if (nHist) setNotifHistory(nHist);

        const lrcFiles = await invokeCommand<any[]>('list_local_lyrics');
        if (lrcFiles) setLocalLyricsFiles(lrcFiles);
      } catch (err) {
        console.error('Failed to load control center data:', err);
      }
    };

    loadData();
  }, [isOpen]);

  // Periodic music update when Music tab, Overview, or Show All is active
  useEffect(() => {
    if (!isOpen || (activeTab !== 'overview' && activeTab !== 'music_lyrics' && activeTab !== 'show_all')) return;

    const timer = setInterval(async () => {
      try {
        const music = await invokeCommand<any>('get_music_status');
        if (music) setMusicStatus(music);
      } catch {}
    }, 2000);

    return () => clearInterval(timer);
  }, [isOpen, activeTab]);

  const runDoctor = async () => {
    setIsDoctorRunning(true);
    try {
      const res = await invokeCommand<any>('run_lulu_doctor');
      setDoctorReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDoctorRunning(false);
    }
  };

  const handleToggleMusicPlayPause = async () => {
    try {
      await invokeCommand('music_play_pause');
      const updated = await invokeCommand<any>('get_music_status');
      if (updated) setMusicStatus(updated);
    } catch {}
  };

  const handleMusicNext = async () => {
    try {
      await invokeCommand('music_next');
      const updated = await invokeCommand<any>('get_music_status');
      if (updated) setMusicStatus(updated);
    } catch {}
  };

  const handleMusicPrev = async () => {
    try {
      await invokeCommand('music_previous');
      const updated = await invokeCommand<any>('get_music_status');
      if (updated) setMusicStatus(updated);
    } catch {}
  };

  const handleSearchLyrics = async () => {
    if (!lyricsSearchQuery.trim()) return;
    setIsSearchingLyrics(true);
    try {
      const results = await spotifyLyricsService.searchLyrics(lyricsSearchQuery.trim());
      setLyricsSearchResults(results);
      if (results.length === 0) {
        messageManager.enqueue(`No online lyrics found for "${lyricsSearchQuery.trim()}".`, 'normal', 'interaction');
      }
    } catch (e) {
      console.error(e);
      messageManager.enqueue('Lyrics search API network error.', 'high', 'interaction');
    } finally {
      setIsSearchingLyrics(false);
    }
  };

  const handleApplySearchResult = async (result: LyricsSearchResult) => {
    const raw = result.syncedLyrics || result.plainLyrics;
    if (raw) {
      const title = result.trackName || musicStatus?.title || 'Unknown';
      const artist = result.artistName || musicStatus?.artist || 'Unknown';
      const parsed = await spotifyLyricsService.setCustomLyrics(artist, title, raw);
      setParsedLrc(parsed);
      messageManager.enqueue(`Applied lyrics for "${title}"!`, 'normal', 'interaction');
      setLyricsSearchResults([]);
    }
  };

  const handleAdjustSyncOffset = (deltaSecs: number) => {
    const newOffset = Math.round((lyricsSyncOffset + deltaSecs) * 100) / 100;
    spotifyLyricsService.setSyncOffset(newOffset);
    setLyricsSyncOffset(newOffset);
    messageManager.enqueue(`Lyrics sync offset: ${newOffset > 0 ? `+${newOffset}` : newOffset}s`, 'low', 'interaction');
  };

  const handleSaveNotifSettings = async (newSettings: any) => {
    setNotifSettings(newSettings);
    try {
      await invokeCommand('save_notification_settings', { settings: newSettings });
    } catch {}
  };

  const handleSendTestNotification = async () => {
    try {
      const item = await invokeCommand<any>('emit_test_notification', {
        appName: testApp,
        title: testTitle,
        body: notifSettings.show_body ? 'Sample notification message body' : null,
      });
      if (item) {
        setNotifHistory((prev) => [item, ...prev]);
        messageManager.enqueue(`${item.app_name}: ${item.title}`, 'critical', 'notification');
      }
    } catch (e) {
      console.error('Test notification failed:', e);
    }
  };

  const handleClearHistory = async () => {
    try {
      await invokeCommand('clear_notification_history');
      setNotifHistory([]);
    } catch {}
  };

  const handleExportData = async () => {
    try {
      const data = await invokeCommand<any>('export_user_data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lulu-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + err);
    }
  };

  const handleSaveCustomLrc = async () => {
    if (!customLrcText.trim()) return;
    try {
      const filename = `lyrics_${Date.now()}.lrc`;
      await invokeCommand('save_lyrics_file', {
        filename,
        content: customLrcText,
      });
      const parsed = LrcParser.parse(customLrcText);
      setParsedLrc(parsed);
      setSelectedLrcContent(customLrcText);
      setCustomLrcText('');
      const updated = await invokeCommand<any[]>('list_local_lyrics');
      if (updated) setLocalLyricsFiles(updated);
    } catch (err) {
      alert('Save lyrics failed: ' + err);
    }
  };

  const handleSelectLrcFile = async (filename: string) => {
    try {
      const content = await invokeCommand<string>('read_lyrics_file', { filename });
      setSelectedLrcContent(content);
      const parsed = LrcParser.parse(content);
      setParsedLrc(parsed);
    } catch (err) {
      console.error('Failed to read lyrics:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 select-none">
      <div className="bg-[#14141e] border border-[#313244] rounded-2xl shadow-2xl w-full max-w-3xl h-full max-h-[620px] flex flex-col overflow-hidden text-gray-200 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e2e] border-b border-[#313244] shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm text-purple-300">
            <Sparkles size={16} className="text-yellow-400" />
            <span>Lulu Control Center</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              v0.2.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body (Sidebar + Content) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-36 sm:w-44 bg-[#11111b] border-r border-[#313244] p-2 space-y-1 shrink-0 overflow-y-auto">
            <button
              onClick={() => setActiveTab('show_all')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition mb-1.5 ${
                activeTab === 'show_all'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'text-amber-300 hover:text-white hover:bg-white/5 border border-amber-500/30 bg-amber-500/10'
              }`}
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>⚡ Show All</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity size={14} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'tasks'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CheckSquare size={14} className="text-emerald-400" />
              <span>Tasks & Abilities</span>
            </button>

            <button
              onClick={() => setActiveTab('pet')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'pet'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart size={14} />
              <span>Pet & Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'notifications'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell size={14} />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('music_lyrics')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'music_lyrics'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Music size={14} />
              <span>Music & Lyrics</span>
            </button>

            <button
              onClick={() => setActiveTab('movement_monitors')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'movement_monitors'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Monitor size={14} />
              <span>Screen & Walk</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy_storage')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'privacy_storage'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield size={14} />
              <span>Privacy & DB</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnostics_about')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'diagnostics_about'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Stethoscope size={14} />
              <span>Diagnostics</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-5 overflow-y-auto">
            {/* 0. SHOW ALL UNIFIED DASHBOARD */}
            {activeTab === 'show_all' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-pink-900/40 border border-purple-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-400 animate-pulse" />
                      <span>Master Shinobi Console & All Tasks</span>
                    </h3>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Unified studio: 7 master shinobi poses, all 12 tasks, Spotify lyrics karaoke & movement cadence
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onUnlockAll?.();
                        messageManager.enqueue('🎉 All 12 Tasks and Flames 100% Unlocked!', 'high', 'interaction');
                      }}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600/40 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-600/60 flex items-center gap-1.5 text-xs font-bold transition shadow"
                    >
                      <Unlock size={14} className="text-emerald-300" />
                      <span>Unlock All 12 Tasks</span>
                    </button>

                    <button
                      onClick={() => {
                        if (isContinuousRunning) {
                          onToggleContinuousRun?.();
                        } else {
                          onStart40sRun?.();
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-purple-600/40 border border-purple-400/50 text-purple-200 hover:bg-purple-600/60 flex items-center gap-1.5 text-xs font-bold transition shadow"
                    >
                      <Zap size={14} className="text-yellow-400" />
                      <span>{isContinuousRunning ? 'Stop Sprint' : '40s Sprint Run'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Character Status & Quick Toggles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-[#181825] border border-[#313244] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Current Mood</p>
                      <p className="text-xs font-bold text-white capitalize">{mood}</p>
                    </div>
                    <button
                      onClick={onPetLulu}
                      className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500/40 text-[10px] font-bold"
                      title="Pet Lulu"
                    >
                      <Heart size={14} />
                    </button>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">State / Sleep</p>
                      <p className="text-xs font-bold text-white">
                        {isSleeping ? '💤 Asleep' : '⚡ Awake'}
                      </p>
                    </div>
                    <button
                      onClick={onToggleSleep}
                      className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40 text-[10px] font-bold"
                      title="Toggle Sleep"
                    >
                      <Moon size={14} />
                    </button>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Speech Text Style</p>
                      <p className="text-xs font-bold text-white">
                        {showText ? 'Visible' : 'Hidden'}
                      </p>
                    </div>
                    <button
                      onClick={onToggleShowText}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                        showText ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {showText ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] p-2.5 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Movement</p>
                      <p className="text-xs font-bold text-white">
                        {isMovementPaused ? '⏸ Paused' : `${speedMultiplier}x Active`}
                      </p>
                    </div>
                    <button
                      onClick={isMovementPaused ? onResumeMovement : onPauseMovement}
                      className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 text-[10px] font-bold"
                      title={isMovementPaused ? 'Resume' : 'Pause'}
                    >
                      {isMovementPaused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                  </div>
                </div>

                {/* 1. SEVEN MASTER SHINOBI SPRITES CONSOLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>7 Master Shinobi Poses (High-Res 512x512)</span>
                    </h4>
                    <span className="text-[10px] font-semibold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      7 / 7 Poses Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {SHINOBI_SPRITES.map((sprite) => (
                      <div
                        key={sprite.id}
                        className="bg-[#181825] border border-[#313244] hover:border-purple-500/50 p-2.5 rounded-xl flex flex-col items-center text-center group transition"
                      >
                        <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/10 p-1 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition">
                          <img
                            src={sprite.image}
                            alt={sprite.name}
                            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-white mt-1.5 truncate max-w-full">
                          {sprite.name}
                        </span>
                        <span className="text-[8px] text-purple-300 font-medium px-1.5 py-0.2 rounded bg-purple-950/60 border border-purple-800/40 mt-0.5 truncate max-w-full">
                          {sprite.badge}
                        </span>
                        <p className="text-[9px] text-gray-400 mt-1 line-clamp-2 leading-tight">
                          {sprite.desc}
                        </p>
                        <button
                          onClick={() => {
                            if (sprite.id === 'run') {
                              onStart40sRun?.();
                            } else {
                              onTriggerAnimation?.(sprite.id);
                            }
                            messageManager.enqueue(`Triggered pose: ${sprite.name}!`, 'normal', 'interaction');
                          }}
                          className="w-full mt-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/40 text-purple-200 text-[10px] font-bold transition flex items-center justify-center gap-1"
                        >
                          <Zap size={10} className="text-yellow-400" />
                          <span>Pose</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. ALL 12 TASKS & ABILITIES CATALOG */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare size={14} className="text-emerald-400" />
                      <span>All 12 Shinobi Tasks & Progression</span>
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                      {LULU_TASKS.length} / {LULU_TASKS.length} Unlocked
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {LULU_TASKS.map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#181825] border border-[#313244] hover:border-emerald-500/40 p-2.5 rounded-xl transition flex gap-2.5 items-start group"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={getTaskImage(task.imageKey)}
                            alt={task.title}
                            className="w-12 h-12 object-contain rounded-xl bg-black/40 p-1 border border-white/10 filter drop-shadow-md group-hover:scale-105 transition"
                          />
                          <div className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-0.5 shadow">
                            <CheckCircle2 size={10} className="text-black fill-emerald-400" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 truncate">
                              {task.category}
                            </span>
                            <span className="text-[8px] text-emerald-300 font-semibold bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800/40 flex-shrink-0">
                              Unlocked
                            </span>
                          </div>
                          <h5 className="text-[11px] font-bold text-white truncate mt-0.5">{task.title}</h5>
                          <p className="text-[9px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                            {task.description}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[8px] text-amber-300 font-medium truncate max-w-[100px]">
                              🎁 {task.reward}
                            </span>
                            <button
                              onClick={() => {
                                if (task.actionId === 'sprint_dash') {
                                  onStart40sRun?.();
                                } else if (task.actionId === 'all') {
                                  onUnlockAll?.();
                                } else {
                                  onTriggerAnimation?.(task.actionId);
                                }
                                messageManager.enqueue(`Triggering task: ${task.title}!`, 'normal', 'interaction');
                              }}
                              className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/40 text-purple-200 text-[9px] font-bold transition flex items-center gap-1"
                            >
                              <Zap size={9} className="text-yellow-400" />
                              <span>Trigger</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. SPOTIFY KARAOKE & LYRICS API SEARCH */}
                <div className="bg-[#181825] border border-[#313244] p-4 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Music size={16} className="text-pink-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Spotify MPRIS & Karaoke Lyrics Studio
                      </h4>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                        {spotifyLyricsService.getCurrentSource()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                        <span className="text-[9px] text-gray-400">Sync:</span>
                        <button
                          onClick={() => handleAdjustSyncOffset(-0.25)}
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 text-[9px] font-mono font-bold"
                          title="-0.25s"
                        >
                          -0.25s
                        </button>
                        <span className="text-[10px] font-mono font-bold text-amber-300">
                          {lyricsSyncOffset > 0 ? `+${lyricsSyncOffset.toFixed(2)}` : lyricsSyncOffset.toFixed(2)}s
                        </span>
                        <button
                          onClick={() => handleAdjustSyncOffset(0.25)}
                          className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 text-[9px] font-mono font-bold"
                          title="+0.25s"
                        >
                          +0.25s
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          onTriggerAnimation?.('sing');
                          messageManager.enqueue('🎤 Lulu is singing along with Spotify!', 'normal', 'interaction');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-pink-600/30 border border-pink-500/40 text-pink-200 hover:bg-pink-600/50 flex items-center gap-1 text-xs font-bold transition shadow-sm"
                      >
                        <Mic size={12} className="text-pink-400" />
                        <span>Sing Along</span>
                      </button>
                    </div>
                  </div>

                  {/* Player Bar & Lyrics Search */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* MPRIS Controls */}
                    <div className="bg-black/30 border border-white/5 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 truncate">
                          Player: {musicStatus?.player || 'None'}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          musicStatus?.playback_status === 'Playing' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {musicStatus?.playback_status || 'Stopped'}
                        </span>
                      </div>
                      <div className="py-2 text-center">
                        <p className="text-xs font-bold text-pink-300 truncate">
                          {musicStatus?.title || 'No Track Playing'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {musicStatus?.artist || 'Idle Player'}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={handleMusicPrev} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300">
                          <SkipBack size={14} />
                        </button>
                        <button onClick={handleToggleMusicPlayPause} className="p-2 rounded-full bg-pink-600 hover:bg-pink-500 text-white shadow">
                          {musicStatus?.playback_status === 'Playing' ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button onClick={handleMusicNext} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300">
                          <SkipForward size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Online Lyrics Search API */}
                    <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1">
                          <Search size={11} className="text-emerald-400" /> Search Online Lyrics
                        </span>
                        <span className="text-[9px] text-gray-500">LRCLIB API</span>
                      </div>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={lyricsSearchQuery}
                          onChange={(e) => setLyricsSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchLyrics()}
                          placeholder="Song title or artist..."
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-pink-500/50"
                        />
                        <button
                          onClick={handleSearchLyrics}
                          disabled={isSearchingLyrics}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/50 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                        >
                          {isSearchingLyrics ? <RefreshCw size={11} className="animate-spin" /> : <Search size={11} />}
                          <span>Search</span>
                        </button>
                      </div>

                      {/* Top results */}
                      {lyricsSearchResults.length > 0 && (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {lyricsSearchResults.slice(0, 3).map((res) => (
                            <div key={res.id} className="p-1.5 rounded bg-black/50 border border-white/5 flex items-center justify-between text-[10px]">
                              <div className="truncate flex-1 pr-2">
                                <span className="font-bold text-white">{res.trackName}</span>
                                <span className="text-gray-400 ml-1">({res.artistName})</span>
                              </div>
                              <button
                                onClick={() => handleApplySearchResult(res)}
                                className="px-1.5 py-0.5 rounded bg-pink-600 text-white font-bold text-[9px] flex-shrink-0"
                              >
                                Sync
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lyrics Display */}
                  <LyricsViewer
                    parsedLrc={parsedLrc}
                    currentTimeSecs={musicStatus?.position_secs || 0}
                  />
                </div>

                {/* 4. MOVEMENT CADENCE & SPEED MULTIPLIER */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders size={14} className="text-purple-400" />
                      <span>Movement Cadence & Speed Multiplier</span>
                    </h5>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Current speed: <strong className="text-purple-300">{speedMultiplier}x</strong> • Direction: <strong className="text-purple-300">{currentDirection}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[0.5, 1.0, 1.5, 2.0, 3.0].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => onSetSpeedMultiplier?.(speed)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          speedMultiplier === speed
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                    <button
                      onClick={onStopMovement}
                      className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 text-xs font-bold transition ml-1"
                    >
                      Stop
                    </button>
                  </div>
                </div>

                {/* 5. COMPUTER SYSTEM TELEMETRY & FOLLOW MODE (config for follow system comoputer all) */}
                <div className="bg-[#181825] border border-[#313244] p-4 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Cpu size={16} className="text-cyan-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Computer System Telemetry & Follow Mode
                      </h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                        preferences.behavior_mode === 'SYSTEM_SYNC'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                          : 'bg-gray-800 text-gray-400 border-white/5'
                      }`}>
                        {preferences.behavior_mode === 'SYSTEM_SYNC' ? '⚡ System Follow Active' : 'Standby'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const newMode = preferences.behavior_mode === 'SYSTEM_SYNC' ? 'NORMAL' : 'SYSTEM_SYNC';
                        onUpdatePreferences({ ...preferences, behavior_mode: newMode });
                        messageManager.enqueue(
                          newMode === 'SYSTEM_SYNC'
                            ? '💻 Follow Computer System Mode activated! Lulu now syncs with CPU & Battery! ⚡'
                            : '🐾 Returned to Normal companion mode.',
                          'high',
                          'interaction'
                        );
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
                        preferences.behavior_mode === 'SYSTEM_SYNC'
                          ? 'bg-cyan-600 text-white shadow-cyan-500/30'
                          : 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-600/50'
                      }`}
                    >
                      <Laptop size={12} />
                      <span>{preferences.behavior_mode === 'SYSTEM_SYNC' ? '✓ Following System Active' : 'Enable Follow System Mode'}</span>
                    </button>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* CPU Usage */}
                    <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Cpu size={11} className="text-cyan-400" /> CPU Load</span>
                        <span className="font-mono font-bold text-white">{Math.round(systemTelemetry?.cpuPercent ?? 0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#313244] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            (systemTelemetry?.cpuPercent ?? 0) > 70 ? 'bg-red-500' : (systemTelemetry?.cpuPercent ?? 0) > 40 ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${Math.min(100, systemTelemetry?.cpuPercent ?? 0)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-500 truncate">
                        {systemTelemetry?.cpuCores ? `${systemTelemetry.cpuCores} Logical Cores` : 'Multi-core CPU'}
                      </p>
                    </div>

                    {/* RAM Usage */}
                    <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Activity size={11} className="text-purple-400" /> Memory</span>
                        <span className="font-mono font-bold text-white">{Math.round(systemTelemetry?.memPercent ?? 0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#313244] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{ width: `${Math.min(100, systemTelemetry?.memPercent ?? 0)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-500 truncate">
                        {Math.round((systemTelemetry?.memUsedMb ?? 0) / 1024 * 10) / 10} / {Math.round((systemTelemetry?.memTotalMb ?? 1) / 1024 * 10) / 10} GB
                      </p>
                    </div>

                    {/* Battery Status */}
                    <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Battery size={11} className="text-emerald-400" /> Battery</span>
                        <span className="font-mono font-bold text-white">
                          {systemTelemetry?.batteryPercent !== undefined ? `${systemTelemetry.batteryPercent}%` : 'AC Power'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#313244] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${systemTelemetry?.batteryPercent ?? 100}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-gray-500 truncate">
                        {systemTelemetry?.isCharging ? '⚡ Charging Active' : 'Power Connected'}
                      </p>
                    </div>

                    {/* OS Platform */}
                    <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Monitor size={11} className="text-blue-400" /> Environment</span>
                        <span className="font-bold text-emerald-400 text-[10px]">Sway Wayland</span>
                      </div>
                      <p className="text-[10px] font-bold text-white truncate mt-1">
                        {systemTelemetry?.osName || 'Linux Desktop'}
                      </p>
                      <p className="text-[9px] text-gray-500 truncate">
                        Profile: {systemTelemetry?.profile || 'Auto'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. ALL 7 BEHAVIOR MODES & CHARACTER MODELS UNLOCKED (update mode unlock all) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>All 7 Behavior Modes (100% Unlocked)</span>
                    </h4>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40">
                      Current: {preferences.behavior_mode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {ALL_BEHAVIOR_MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onUpdatePreferences({ ...preferences, behavior_mode: m.id });
                          messageManager.enqueue(`Activated ${m.label} mode! ${m.icon}`, 'normal', 'interaction');
                        }}
                        className={`p-2 rounded-xl border text-left transition flex flex-col justify-between group ${
                          preferences.behavior_mode === m.id
                            ? 'bg-purple-600/30 border-purple-500 shadow-md shadow-purple-500/20'
                            : 'bg-[#181825] border-[#313244] hover:border-purple-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-base">{m.icon}</span>
                            <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                              preferences.behavior_mode === m.id ? 'bg-purple-500 text-white' : 'bg-white/5 text-gray-400'
                            }`}>
                              {m.badge}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white mt-1 group-hover:text-purple-300 transition truncate">
                            {m.label}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">
                            {m.desc}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold mt-2 text-center py-0.5 rounded ${
                          preferences.behavior_mode === m.id ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300 group-hover:bg-white/10'
                        }`}>
                          {preferences.behavior_mode === m.id ? 'Active' : 'Select'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Character Model Selector */}
                  <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={12} className="text-pink-400" />
                      <span>Character Model Engine (All Unlocked)</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'shadow_shinobi', name: 'Shadow Shinobi (Madara Chibi)' },
                        { id: 'anime_chibi', name: 'Anime Chibi (Cute Blue)' },
                        { id: 'celestial_kitsune', name: 'Celestial Kitsune (Pink)' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          onClick={() => {
                            onUpdatePreferences({ ...preferences, character_style: style.id as CharacterStyle });
                            messageManager.enqueue(`Switched character model to ${style.name}!`, 'normal', 'interaction');
                          }}
                          className={`p-2 rounded-lg border text-center transition ${
                            preferences.character_style === style.id
                              ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold'
                              : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity size={16} className="text-purple-400" /> System Overview
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl">
                    <p className="text-gray-400 text-[10px]">Lulu Status</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {isSleeping ? '💤 Sleeping' : '⚡ Active'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Mood: {mood}</p>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl">
                    <p className="text-gray-400 text-[10px]">Movement Mode</p>
                    <p className="text-sm font-bold text-purple-300 mt-1">
                      {preferences.behavior_mode}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Speed: {preferences.wander_speed}x</p>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl">
                    <p className="text-gray-400 text-[10px]">Music (MPRIS)</p>
                    <p className="text-sm font-bold text-pink-300 mt-1 truncate">
                      {musicStatus && musicStatus.playback_status === 'Playing'
                        ? `🎵 ${musicStatus.title || 'Playing'}`
                        : 'No Music Playing'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {musicStatus?.player ? `Player: ${musicStatus.player}` : 'Offline'}
                    </p>
                  </div>

                  <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl">
                    <p className="text-gray-400 text-[10px]">Notifications (D-Bus)</p>
                    <p className="text-sm font-bold text-amber-300 mt-1">
                      {notifSettings.listener_enabled ? 'Active Listening' : 'Disabled'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      History: {notifHistory.length} events
                    </p>
                  </div>
                </div>

                {/* Quick Needs Bar */}
                <div className="bg-[#181825] border border-[#313244] p-4 rounded-xl space-y-2">
                  <p className="font-semibold text-xs text-gray-300">Vitals & Happiness</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span>Energy</span>
                      <span>{Math.round(needs.energy)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#313244] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${needs.energy}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] pt-1">
                      <span>Happiness</span>
                      <span>{Math.round(needs.happiness)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#313244] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 transition-all"
                        style={{ width: `${needs.happiness}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TASKS & PROGRESSION TAB (update tak all add img) */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <CheckSquare size={16} className="text-emerald-400" /> Tasks & Ability Progression
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      All companion katas, high-speed sprint, and live audio lip-sync tasks with visual previews
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      {LULU_TASKS.filter((t) => t.isCompleted).length}/{LULU_TASKS.length} Completed (100%)
                    </span>
                    <button
                      onClick={() => {
                        onUnlockAll?.();
                        messageManager.enqueue('🎉 All tasks and flame abilities are 100% unlocked!', 'high', 'interaction');
                      }}
                      className="py-1 px-3 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/50 flex items-center gap-1.5 text-xs font-bold transition shadow-sm"
                    >
                      <Unlock size={12} className="text-emerald-300" />
                      <span>Unlock All</span>
                    </button>
                  </div>
                </div>

                {/* Tasks Cards Grid with Visual Character Images */}
                <div className="grid grid-cols-2 gap-3">
                  {LULU_TASKS.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#181825] border border-[#313244] hover:border-emerald-500/40 p-3 rounded-xl transition flex gap-3 items-start group"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={getTaskImage(task.imageKey)}
                          alt={task.title}
                          className="w-14 h-14 object-contain rounded-xl bg-black/40 p-1 border border-white/10 filter drop-shadow-md group-hover:scale-105 transition"
                        />
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-black rounded-full p-0.5 shadow">
                          <CheckCircle2 size={12} className="text-black fill-emerald-400" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                            {task.category}
                          </span>
                          <span className="text-[9px] text-emerald-300 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                            100% Complete
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">{task.title}</h4>
                        <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                          {task.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[9px] text-amber-300 font-medium truncate max-w-[140px]">
                            🎁 {task.reward}
                          </span>
                          <button
                            onClick={() => {
                              if (task.actionId === 'sprint_dash') {
                                onStart40sRun?.();
                              } else if (task.actionId === 'all') {
                                onUnlockAll?.();
                              } else {
                                onTriggerAnimation?.(task.actionId);
                              }
                              messageManager.enqueue(`Triggering task: ${task.title}!`, 'normal', 'interaction');
                            }}
                            className="px-2 py-0.5 rounded bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/40 text-purple-200 text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <Zap size={10} className="text-yellow-400" />
                            <span>Trigger</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 9 Master Flame Styles Grid with Images */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Master Flame Abilities (9/9 Unlocked)
                    </p>
                    <span className="text-[10px] text-gray-400">Click any flame to trigger</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {Object.values(LULU_FLAME_STYLES).map((flame) => (
                      <button
                        key={flame.id}
                        onClick={() => {
                          if (flame.id === 'sprint_dash') {
                            onStart40sRun?.();
                          } else {
                            onTriggerAnimation?.(flame.animation);
                          }
                          messageManager.enqueue(`Triggering ${flame.name}!`, 'normal', 'interaction');
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/50 hover:bg-amber-900/20 text-gray-300 hover:text-amber-200 transition text-left"
                      >
                        <img
                          src={getFlameImage(flame.id)}
                          alt={flame.name}
                          className="w-10 h-10 object-contain rounded-lg bg-black/60 p-0.5 border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs truncate">{flame.name}</div>
                          <div className="text-[10px] text-emerald-400 font-medium">1 Frame • Smooth</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. PET & ANIMATION STUDIO TAB */}
            {activeTab === 'pet' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Heart size={16} className="text-rose-400" /> Pet & 17-Function Animation Studio
                </h3>

                {/* Quick Interactions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPetLulu}
                    className="flex-1 py-2 px-3 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-200 hover:bg-rose-600/50 flex items-center justify-center gap-1.5 transition font-medium"
                  >
                    <Heart size={13} className="text-rose-400" /> Pet Lulu
                  </button>
                  {onSendLove && (
                    <button
                      onClick={onSendLove}
                      className="flex-1 py-2 px-3 rounded-lg bg-pink-600/30 border border-pink-500/40 text-pink-200 hover:bg-pink-600/50 flex items-center justify-center gap-1.5 transition font-medium"
                    >
                      <Sparkles size={13} className="text-yellow-300" /> Lulu Aime ❤️
                    </button>
                  )}
                  <button
                    onClick={onFeedSnack}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-600/30 border border-amber-500/40 text-amber-200 hover:bg-amber-600/50 flex items-center justify-center gap-1.5 transition font-medium"
                  >
                    <Coffee size={13} className="text-amber-400" /> Feed Snack
                  </button>
                  <button
                    onClick={onToggleSleep}
                    className="flex-1 py-2 px-3 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-600/50 flex items-center justify-center gap-1.5 transition font-medium"
                  >
                    <Moon size={13} className="text-indigo-400" /> {isSleeping ? 'Wake' : 'Sleep'}
                  </button>
                </div>

                {/* Status Indicator (Requirement 19) */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                      🐾 <span>Lulu Live Status</span>
                    </p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isSleeping
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : is40sRunActive || isContinuousRunning
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 animate-pulse'
                        : isMovementPaused
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {isSleeping
                        ? 'SLEEPING'
                        : isMovementPaused
                        ? 'PAUSED'
                        : is40sRunActive
                        ? 'TIMED RUN'
                        : isContinuousRunning
                        ? 'SHOW RUN'
                        : currentDirection !== 'idle'
                        ? 'RUNNING'
                        : musicStatus?.playback_status === 'Playing'
                        ? 'DANCING'
                        : 'IDLE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                      <div className="text-[10px] text-gray-400">Mode:</div>
                      <div className="font-bold text-yellow-300 mt-0.5">
                        {is40sRunActive
                          ? 'TIMED RUN'
                          : isContinuousRunning
                          ? 'SHOW RUN'
                          : isMovementPaused
                          ? 'PAUSED'
                          : currentDirection !== 'idle'
                          ? 'RUNNING'
                          : 'IDLE'}
                      </div>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                      <div className="text-[10px] text-gray-400">Direction:</div>
                      <div className="font-bold text-cyan-300 mt-0.5 uppercase">
                        {currentDirection !== 'idle' ? currentDirection : 'CENTER'}
                      </div>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                      <div className="text-[10px] text-gray-400">Frame:</div>
                      <div className="font-mono font-bold text-emerald-300 mt-0.5">
                        {currentDirection !== 'idle' || isContinuousRunning || is40sRunActive
                          ? `Frame ${currentFrame + 1}`
                          : 'Ready'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text & Flame Speed Configuration ("config show txt and change flam update to get to slow -40%") */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                        <FileText size={13} className="text-cyan-400" /> Show Text & Subtitles
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Display active flame banners, thought bubbles, and lyric text
                      </p>
                    </div>
                    <button
                      onClick={onToggleShowText}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                        showText
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                          : 'bg-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {showText ? '✓ Text Visible' : 'Hidden'}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                        <Zap size={13} className="text-yellow-400" /> Flame Update Speed
                      </p>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        {speedMultiplier < 0.9
                          ? '🐢 Relaxed (Slow)'
                          : speedMultiplier > 1.1
                          ? '⚡ Fast'
                          : '✨ Normal & Smooth'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {Object.values(FLAME_SPEED_PRESETS).map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            onSetSpeedMultiplier?.(preset.multiplier);
                            messageManager.enqueue(`Flame update speed set to ${preset.label}`, 'normal', 'interaction');
                          }}
                          className={`py-1.5 px-2 rounded-lg border text-center transition text-[11px] font-bold ${
                            Math.abs(speedMultiplier - preset.multiplier) < 0.05
                              ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm'
                              : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tasks & Progression: Unlock All ("in add tatk for unlock all") */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                        <Unlock size={14} className="text-emerald-400" /> Tasks: Unlock All Flames & Abilities
                      </p>
                      <p className="text-[10px] text-gray-400">
                        100% Unlocked: All 9 Master Flames & 17 Shinobi Katas ready
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onUnlockAll?.();
                        messageManager.enqueue('🎉 All 9 Master Flames and Shinobi abilities are 100% Unlocked!', 'high', 'interaction');
                      }}
                      className="py-1 px-3 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/50 flex items-center gap-1.5 text-xs font-bold transition shadow-sm"
                    >
                      <Unlock size={12} className="text-emerald-300" />
                      <span>Unlock All</span>
                    </button>
                  </div>

                  {/* 9 Master Flame Styles Grid */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {Object.values(LULU_FLAME_STYLES).map((flame) => (
                      <button
                        key={flame.id}
                        onClick={() => {
                          if (flame.id === 'sprint_dash') {
                            onStart40sRun?.();
                          } else {
                            onTriggerAnimation?.(flame.animation);
                          }
                          messageManager.enqueue(`Triggering ${flame.name}!`, 'normal', 'interaction');
                        }}
                        className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:border-amber-500/50 hover:bg-amber-900/20 text-gray-300 hover:text-amber-200 transition text-left flex items-center gap-2"
                      >
                        <img
                          src={getFlameImage(flame.id)}
                          alt={flame.name}
                          className="w-8 h-8 object-contain rounded bg-black/60 p-0.5 border border-white/10 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] truncate">{flame.name}</div>
                          <div className="text-[9px] text-emerald-400/80 font-medium">1 Frame • Smooth</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation Controls (Requirement 18) */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-300 text-xs flex items-center gap-1.5">
                      <Zap size={13} className="text-yellow-400" /> Animation Controls
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 font-medium">Interval:</span>
                      <select
                        value={focusIntervalSeconds === 0 ? 'OFF' : focusIntervalSeconds}
                        onChange={(e) => onSetFocusInterval?.(e.target.value === 'OFF' ? 0 : Number(e.target.value))}
                        className="bg-black/50 border border-white/10 rounded px-2 py-0.5 text-[10px] font-bold text-amber-300 focus:outline-none"
                      >
                        <option value={40}>40s</option>
                        <option value={30}>30s (2 img)</option>
                        <option value={60}>1m</option>
                        <option value={300}>5m</option>
                        <option value={900}>15m</option>
                        <option value={1800}>30m</option>
                        <option value="OFF">OFF</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {/* [⚡ Flame Sprint] */}
                    <button
                      onClick={onStart40sRun}
                      className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition font-bold text-xs truncate ${
                        is40sRunActive
                          ? 'bg-amber-500 text-black border-yellow-300 shadow-md shadow-amber-500/20'
                          : 'bg-yellow-600/30 border-yellow-500/40 text-yellow-200 hover:bg-yellow-600/50'
                      }`}
                      title="Flame Sprint (Autonomous run)"
                    >
                      <Zap size={12} className={is40sRunActive ? 'text-black fill-black shrink-0' : 'text-yellow-300 shrink-0'} />
                      <span>{is40sRunActive ? 'Stop' : '⚡ Sprint'}</span>
                    </button>

                    {/* [⚡ SHOW RUN] */}
                    <button
                      onClick={onToggleContinuousRun}
                      className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition font-bold text-xs truncate ${
                        isContinuousRunning
                          ? 'bg-yellow-500 text-black border-yellow-300 shadow-md shadow-amber-500/20'
                          : 'bg-yellow-600/30 border-yellow-500/40 text-yellow-200 hover:bg-yellow-600/50'
                      }`}
                      title="SHOW RUN: Continuous Sprint across the screen"
                    >
                      <Zap size={12} className={isContinuousRunning ? 'text-black fill-black shrink-0' : 'text-yellow-300 shrink-0'} />
                      <span>{isContinuousRunning ? 'Stop SHOW' : '⚡ SHOW RUN'}</span>
                    </button>

                    {/* [Stop] */}
                    <button
                      onClick={onStopMovement}
                      className="py-1.5 px-2 rounded-lg bg-red-600/30 border border-red-500/40 text-red-200 hover:bg-red-600/50 flex items-center justify-center gap-1 transition font-medium text-xs truncate"
                      title="Stop all movement immediately"
                    >
                      <span>Stop</span>
                    </button>

                    {/* [Pause] */}
                    <button
                      onClick={isMovementPaused ? onResumeMovement : onPauseMovement}
                      className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition font-medium text-xs truncate ${
                        isMovementPaused
                          ? 'bg-purple-600 text-white border-purple-400 font-bold'
                          : 'bg-purple-600/30 border-purple-500/40 text-purple-200 hover:bg-purple-600/50'
                      }`}
                      title={isMovementPaused ? 'Resume movement' : 'Pause movement'}
                    >
                      <span>{isMovementPaused ? '▶ Resume' : '⏸ Pause'}</span>
                    </button>
                  </div>
                </div>

                {/* Character Style Selection */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <p className="font-semibold text-gray-300">Original Character Model</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'shadow_shinobi', name: 'Shadow Shinobi (Madara Chibi)' },
                      { id: 'anime_chibi', name: 'Anime Chibi (Cute Blue)' },
                      { id: 'celestial_kitsune', name: 'Celestial Kitsune (Pink)' },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() =>
                          onUpdatePreferences({ ...preferences, character_style: style.id as CharacterStyle })
                        }
                        className={`p-2 rounded-lg border text-center transition ${
                          preferences.character_style === style.id
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold'
                            : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7 Master Shinobi Character Sprites Console */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Master Character Sprites (8 Custom Poses)
                    </p>
                    <span className="text-[10px] text-gray-400">Click to switch pose live</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {[
                      { id: 'idle', name: 'Alert Shinobi (Idle)', img: shinobiIdle, desc: 'Arms crossed, Sharingan alert' },
                      { id: 'run-right', name: 'Aerodynamic Sprint (Run)', img: shinobiRun, desc: 'High-speed dust trail & wind' },
                      { id: 'sing', name: 'Karaoke Vocalist (Sing)', img: shinobiSing, desc: 'Mic & live musical notes' },
                      { id: 'happy', name: 'Victory Cheer (Happy)', img: shinobiHappy, desc: 'Hands raised, blush, confetti' },
                      { id: 'sit', name: 'Step Down / Sit', img: shinobiSitdown, desc: 'Cross-legged calm floor rest' },
                      { id: 'sleep', name: 'Zen Slumber (Sleep)', img: shinobiSleep, desc: 'Authentic lying slumber, floating Zzz' },
                      { id: 'sad', name: 'Melancholic (Sad)', img: shinobiSad, desc: 'Slumped sitting, tear droplet' },
                      { id: 'protect', name: 'Susanoo Chakra (Protect)', img: shinobiProtect, desc: 'Hand sign & cyan flame aura' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTriggerAnimation?.(item.id);
                          messageManager.enqueue(`Switched companion pose to ${item.name}!`, 'normal', 'interaction');
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5 hover:border-amber-500/50 hover:bg-amber-900/20 text-gray-300 hover:text-white transition text-left group"
                      >
                        <img
                          src={item.img}
                          alt={item.name}
                          className="w-12 h-12 object-contain rounded-lg bg-black/60 p-0.5 border border-white/10 group-hover:scale-105 transition flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-gray-400 line-clamp-1">{item.desc}</p>
                          <span className="text-[9px] text-amber-300 font-semibold mt-0.5 inline-block">
                            ▶ Trigger Pose
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 17 Function Animation Tester Grid */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <p className="font-semibold text-gray-300 flex items-center justify-between">
                    <span>17 Character Functions (Pure Vector Code)</span>
                    <span className="text-[10px] text-purple-400">Click to preview</span>
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                    {[
                      { id: 'idle', label: '1. Idle' },
                      { id: 'walk-right', label: '2. Walk' },
                      { id: 'run-right', label: '3. Run' },
                      { id: 'jump', label: '4. Jump' },
                      { id: 'sit', label: '5. Sit' },
                      { id: 'sleep', label: '6. Sleep' },
                      { id: 'happy', label: '7. Happy' },
                      { id: 'angry', label: '8. Angry' },
                      { id: 'surprised', label: '9. Surprised' },
                      { id: 'dance', label: '10. Dance' },
                      { id: 'think', label: '11. Think' },
                      { id: 'talk', label: '12. Talk' },
                      { id: 'wave', label: '13. Wave' },
                      { id: 'protect', label: '14. Protect' },
                      { id: 'notification', label: '15. Alert Mode' },
                      { id: 'idle', label: '16. Follow Cursor' },
                      { id: 'idle', label: '17. Drag Physics' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (onTriggerAnimation) onTriggerAnimation(item.id);
                          messageManager.enqueue(`Testing ${item.label}`, 'normal', 'interaction');
                        }}
                        className="p-1.5 rounded-lg bg-black/40 border border-white/5 hover:border-purple-500/50 hover:bg-purple-900/20 text-gray-300 hover:text-white transition text-center truncate"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bell size={16} className="text-amber-400" /> Native Linux Notifications (D-Bus)
                </h3>

                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-200">D-Bus Listener</p>
                      <p className="text-[10px] text-gray-500">
                        Listen to org.freedesktop.Notifications
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.listener_enabled}
                      onChange={(e) =>
                        handleSaveNotifSettings({
                          ...notifSettings,
                          listener_enabled: e.target.checked,
                        })
                      }
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div>
                      <p className="font-semibold text-gray-200">Privacy Mode (Hide Body)</p>
                      <p className="text-[10px] text-gray-500">
                        Default ON — never reads or logs private notification messages
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifSettings.privacy_mode}
                      onChange={(e) =>
                        handleSaveNotifSettings({
                          ...notifSettings,
                          privacy_mode: e.target.checked,
                          show_body: !e.target.checked,
                        })
                      }
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* Send Test Notification */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <p className="font-semibold text-gray-300">Test Notification Trigger</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testApp}
                      onChange={(e) => setTestApp(e.target.value)}
                      placeholder="App Name"
                      className="bg-black/50 border border-white/10 px-2 py-1 rounded text-xs w-28 text-white"
                    />
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      placeholder="Title"
                      className="bg-black/50 border border-white/10 px-2 py-1 rounded text-xs flex-1 text-white"
                    />
                    <button
                      onClick={handleSendTestNotification}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition"
                    >
                      Trigger
                    </button>
                  </div>
                </div>

                {/* Notification History Log */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-300">Recent Notification Events</p>
                    <button
                      onClick={handleClearHistory}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Clear Log
                    </button>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {notifHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent notifications</p>
                    ) : (
                      notifHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded bg-black/30 border border-white/5 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-amber-300">{item.app_name}: </span>
                            <span className="text-gray-300">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {new Date(item.timestamp * 1000).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. MUSIC & LYRICS TAB */}
            {activeTab === 'music_lyrics' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Music size={16} className="text-pink-400" /> Music (MPRIS) & Synchronized Lyrics
                </h3>

                {/* MPRIS Player Controls */}
                <div className="bg-[#181825] border border-[#313244] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Current Player</p>
                      <p className="text-sm font-bold text-white">
                        {musicStatus?.player && musicStatus.player !== 'None'
                          ? musicStatus.player
                          : 'No Player Active'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        musicStatus?.playback_status === 'Playing'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {musicStatus?.playback_status || 'Stopped'}
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-base font-bold text-pink-300">
                      {musicStatus?.title || 'No Track Loaded'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {musicStatus?.artist || 'Unknown Artist'}
                    </p>
                  </div>

                  {/* Playback buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handleMusicPrev}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 transition"
                      title="Previous"
                    >
                      <SkipBack size={16} />
                    </button>
                    <button
                      onClick={handleToggleMusicPlayPause}
                      className="p-3 rounded-full bg-pink-600 hover:bg-pink-500 text-white transition shadow-lg"
                      title="Play/Pause"
                    >
                      {musicStatus?.playback_status === 'Playing' ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} />
                      )}
                    </button>
                    <button
                      onClick={handleMusicNext}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 transition"
                      title="Next"
                    >
                      <SkipForward size={16} />
                    </button>
                  </div>
                </div>

                {/* Lyrics Synchronizer Viewer & Sync Controls */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                        <FileText size={14} className="text-pink-400" /> Synchronized Karaoke Lyrics
                      </p>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                        {spotifyLyricsService.getCurrentSource()}
                      </span>
                    </div>

                    {/* Sing Along with Lulu Action */}
                    <button
                      onClick={() => {
                        onTriggerAnimation?.('sing');
                        messageManager.enqueue('🎤 Lulu is singing along with your Spotify music!', 'normal', 'interaction');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-pink-600/30 border border-pink-500/40 text-pink-200 hover:bg-pink-600/50 flex items-center gap-1.5 text-xs font-bold transition shadow-sm"
                    >
                      <Mic size={12} className="text-pink-400" />
                      <span>Sing Along</span>
                    </button>
                  </div>

                  {/* Sync Offset Adjustment */}
                  <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Sliders size={11} className="text-amber-400" /> Audio Sync Offset:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustSyncOffset(-0.25)}
                        className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 text-[10px] font-mono font-bold"
                        title="Earlier by 0.25s"
                      >
                        -0.25s
                      </button>
                      <span className="text-[11px] font-mono font-bold text-amber-300 px-1">
                        {lyricsSyncOffset > 0 ? `+${lyricsSyncOffset.toFixed(2)}` : lyricsSyncOffset.toFixed(2)}s
                      </span>
                      <button
                        onClick={() => handleAdjustSyncOffset(0.25)}
                        className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-gray-300 text-[10px] font-mono font-bold"
                        title="Later by 0.25s"
                      >
                        +0.25s
                      </button>
                      {lyricsSyncOffset !== 0 && (
                        <button
                          onClick={() => handleAdjustSyncOffset(-lyricsSyncOffset)}
                          className="ml-1 text-[9px] text-gray-500 hover:text-gray-300 underline"
                        >
                          reset
                        </button>
                      )}
                    </div>
                  </div>

                  <LyricsViewer
                    parsedLrc={parsedLrc}
                    currentTimeSecs={musicStatus?.position_secs || 0}
                  />
                </div>

                {/* Spotify & Online Lyrics API Search Box */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-300 text-xs flex items-center gap-1.5">
                      <Search size={13} className="text-emerald-400" /> Spotify Lyrics API Search
                    </p>
                    <span className="text-[10px] text-gray-500">Live multi-track database</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lyricsSearchQuery}
                      onChange={(e) => setLyricsSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchLyrics()}
                      placeholder="Search artist or song title (e.g. Queen Bohemian Rhapsody)..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-pink-500/50"
                    />
                    <button
                      onClick={handleSearchLyrics}
                      disabled={isSearchingLyrics}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/50 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                    >
                      {isSearchingLyrics ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
                      <span>Search API</span>
                    </button>
                  </div>

                  {/* Search Results List */}
                  {lyricsSearchResults.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {lyricsSearchResults.map((res) => (
                        <div
                          key={res.id}
                          className="p-2 rounded-lg bg-black/40 border border-white/5 hover:border-pink-500/40 flex items-center justify-between transition"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="text-xs font-bold text-white truncate">{res.trackName}</p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {res.artistName} {res.albumName ? `• ${res.albumName}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                res.syncedLyrics
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {res.syncedLyrics ? 'Karaoke Synced' : 'Plain Text'}
                            </span>
                            <button
                              onClick={() => handleApplySearchResult(res)}
                              className="px-2 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold transition"
                            >
                              Sync
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Local LRC file input / import */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <p className="font-semibold text-gray-300">Import / Paste .LRC Content</p>
                  <textarea
                    rows={3}
                    value={customLrcText}
                    onChange={(e) => setCustomLrcText(e.target.value)}
                    placeholder="[00:12.50]Paste .lrc timestamps or lyric lines here..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-gray-200 font-mono"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1 overflow-x-auto max-w-[280px]">
                      {localLyricsFiles.map((f) => (
                        <button
                          key={f.filename}
                          onClick={() => handleSelectLrcFile(f.filename)}
                          className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 truncate"
                        >
                          {f.filename}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleSaveCustomLrc}
                      className="px-3 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white font-medium transition text-xs"
                    >
                      Save & Sync
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. MOVEMENT & MONITORS TAB */}
            {activeTab === 'movement_monitors' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Monitor size={16} className="text-blue-400" /> Movement & Multi-Monitor Screen Map
                </h3>

                {/* Movement Mode Selector */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <p className="font-semibold text-gray-300">Desktop Movement Mode</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {ALL_BEHAVIOR_MODES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onUpdatePreferences({ ...preferences, behavior_mode: m.id });
                          messageManager.enqueue(`Mode set to ${m.label} ${m.icon}`, 'normal', 'interaction');
                        }}
                        className={`p-2 rounded-lg font-bold text-center border transition flex flex-col items-center gap-0.5 ${
                          preferences.behavior_mode === m.id
                            ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                            : 'bg-black/30 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="text-sm">{m.icon}</span>
                        <span className="text-[10px] truncate max-w-full">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screen Map */}
                <div className="bg-[#181825] border border-[#313244] p-4 rounded-xl space-y-3">
                  <p className="font-semibold text-gray-300">Screen Layout Map</p>
                  <div className="h-40 bg-black/50 border border-dashed border-white/20 rounded-xl p-3 flex items-center justify-center gap-4 relative">
                    {monitors.length === 0 ? (
                      <div className="text-center text-gray-500 text-xs">
                        Default Display (1920x1080)
                      </div>
                    ) : (
                      monitors.map((mon, idx) => (
                        <div
                          key={mon.name || idx}
                          className="h-28 w-44 bg-blue-900/20 border border-blue-500/40 rounded-lg flex flex-col items-center justify-center p-2 relative shadow-lg"
                        >
                          <span className="font-bold text-blue-300 text-xs truncate max-w-full">
                            {mon.name || `Monitor ${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {mon.width} x {mon.height}
                          </span>
                          {mon.is_primary && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded mt-1">
                              Primary
                            </span>
                          )}
                          {/* Lulu Marker on Primary Monitor */}
                          {idx === 0 && (
                            <div className="absolute bottom-2 right-2 bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow animate-pulse">
                              Lulu Here ⚔️
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 6. PRIVACY & STORAGE TAB */}
            {activeTab === 'privacy_storage' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Shield size={16} className="text-emerald-400" /> Privacy & Local SQLite Storage
                </h3>

                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <p className="font-semibold text-gray-200">Zero Cloud / Offline Policy</p>
                  <div className="space-y-1 text-gray-400 text-[11px]">
                    <p className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 size={13} /> 100% Local SQLite Database (~/.local/share/lulu-desktop/lulu.db)
                    </p>
                    <p className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 size={13} /> Notification body hidden and unsaved by default
                    </p>
                    <p className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 size={13} /> No microphone, screen, or keystroke tracking
                    </p>
                    <p className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 size={13} /> Zero AI cloud API network connections
                    </p>
                  </div>
                </div>

                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-3">
                  <p className="font-semibold text-gray-200">Import & Export Backup</p>
                  <p className="text-[11px] text-gray-400">
                    Export your pet status, themes, and configuration to a portable JSON file.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-2 transition"
                    >
                      <Download size={14} /> Export Backup (.json)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 7. DIAGNOSTICS & ABOUT TAB */}
            {activeTab === 'diagnostics_about' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Stethoscope size={16} className="text-purple-400" /> Platform Capabilities & Diagnostics
                </h3>

                {/* Capability Matrix */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-200">Capability Matrix</p>
                    <span className="text-[10px] text-gray-400">
                      {capabilities?.display_server} ({capabilities?.desktop_env})
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {capabilities?.items?.map((item: any) => (
                      <div
                        key={item.name}
                        className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-white">{item.name}</p>
                          <p className="text-[10px] text-gray-500">{item.reason}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.status === 'SUPPORTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.status === 'PARTIAL'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Doctor Diagnostic Runner */}
                <div className="bg-[#181825] border border-[#313244] p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-200">Lulu System Doctor</p>
                    <button
                      onClick={runDoctor}
                      disabled={isDoctorRunning}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded text-xs flex items-center gap-1.5 transition"
                    >
                      <RefreshCw size={12} className={isDoctorRunning ? 'animate-spin' : ''} />
                      Run Doctor
                    </button>
                  </div>

                  {doctorReport && (
                    <div className="space-y-1 mt-2">
                      {doctorReport.checks?.map((check: any) => (
                        <div
                          key={check.name}
                          className="flex items-center justify-between p-1.5 bg-black/20 rounded text-[11px]"
                        >
                          <span className="text-gray-300">{check.name}</span>
                          <span
                            className={
                              check.status === 'PASS'
                                ? 'text-emerald-400 font-bold'
                                : 'text-amber-400 font-bold'
                            }
                          >
                            {check.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-center text-[10px] text-gray-500 pt-2">
                  Lulu Desktop Companion v0.2.0 • Offline Native Linux Application
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
