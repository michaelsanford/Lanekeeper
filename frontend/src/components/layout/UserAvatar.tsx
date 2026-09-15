import React from 'react';
import type { NetworkStatus } from '../../hooks/useNetworkStatus.js';

interface UserAvatarProps {
  initials: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  networkStatus?: NetworkStatus;
  mfaEnabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  initials,
  displayName,
  avatarUrl,
  isOnline = true,
  networkStatus,
  mfaEnabled = false,
  size = 'md',
  className = '',
  onClick,
  title
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  }[size];

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  }[size];

  // Status indicator color:
  // Green = Online
  // Amber = Server Offline or Browser Offline
  // Violet dot border/ring = MFA active
  const effectiveStatus: NetworkStatus = networkStatus || (isOnline ? 'online' : 'offline');
  const statusColor = effectiveStatus === 'online' ? 'bg-emerald-400 ring-slate-900' : 'bg-amber-400 ring-slate-900';
  const statusLabel =
    effectiveStatus === 'online'
      ? 'Online'
      : effectiveStatus === 'server_offline'
      ? 'Server Offline'
      : 'Offline';

  const content = (
    <div className="relative inline-flex items-center justify-center select-none">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName || initials}
          className={`${sizeClasses} rounded-full object-cover border border-slate-700 shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-sm font-sans tracking-wider border border-indigo-400/30 transition-transform active:scale-95`}
        >
          {initials || 'LK'}
        </div>
      )}

      {/* Online / Status Dot */}
      <span
        className={`absolute bottom-0 right-0 ${dotSizeClasses} rounded-full ring-2 ${statusColor} ${
          mfaEnabled ? 'ring-indigo-400' : ''
        }`}
        title={
          mfaEnabled
            ? `Status: ${statusLabel} (TOTP MFA Active)`
            : `Status: ${statusLabel}`
        }
      />
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || displayName || 'User Profile & Settings'}
        className={`p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
        aria-label={title || displayName || 'User Profile & Settings'}
      >
        {content}
      </button>
    );
  }

  return content;
};
