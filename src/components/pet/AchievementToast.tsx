import React, { useEffect, useState } from 'react';
import { useLuluStore, AchievementToastData } from '../../stores/useLuluStore';
import { Trophy, Sparkles, X } from 'lucide-react';

export const AchievementToast: React.FC = () => {
  const { activeAchievementToast, dismissAchievementToast } = useLuluStore();
  const [isExiting, setIsExiting] = useState(false);
  const [displayed, setDisplayed] = useState<AchievementToastData | null>(null);

  useEffect(() => {
    if (activeAchievementToast) {
      setDisplayed(activeAchievementToast);
      setIsExiting(false);

      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          dismissAchievementToast();
          setDisplayed(null);
          setIsExiting(false);
        }, 250);
      }, 4200);

      return () => clearTimeout(timer);
    } else if (displayed && !isExiting) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setDisplayed(null);
        setIsExiting(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeAchievementToast]);

  if (!displayed) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        left: '10px',
        right: '10px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1.5px solid #F59E0B',
        borderRadius: '12px',
        padding: '8px 10px',
        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25), 0 4px 12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 1000,
        pointerEvents: 'auto',
        userSelect: 'none',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(-10px) scale(0.92)' : 'translateY(0) scale(1)',
        transition: 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Icon with glowing ring */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
          fontSize: '16px',
        }}
      >
        {displayed.icon || <Trophy size={16} color="#FFF" />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#FBBF24',
          }}
        >
          <Sparkles size={11} />
          <span>Achievement Unlocked</span>
        </div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#F8FAFC',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: '1px',
          }}
        >
          {displayed.title}
        </div>
      </div>

      {/* XP Pill */}
      {displayed.xp && (
        <div
          style={{
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FCD34D',
            fontSize: '10px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          +{displayed.xp} XP
        </div>
      )}

      {/* Close button */}
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => {
            dismissAchievementToast();
            setDisplayed(null);
            setIsExiting(false);
          }, 200);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#94A3B8',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
        aria-label="Dismiss toast"
      >
        <X size={13} />
      </button>
    </div>
  );
};
