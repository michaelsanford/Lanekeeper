import React, { useRef, useEffect } from 'react';
import {
  User,
  Palette,
  Sliders,
  Terminal,
  ShieldCheck,
  LogOut,
  LogIn,
  ExternalLink
} from 'lucide-react';
import type { UserProfile } from '../../types/index.js';
import { UserAvatar } from './UserAvatar.js';
import { getInitials } from '../../hooks/useUserProfile.js';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onOpenAppSettings: (tab?: 'profile' | 'themes' | 'features') => void;
  onOpenHelp?: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenAppSettings,
  onOpenHelp,
  onOpenAuth,
  onSignOut
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initials = getInitials(profile.displayName, profile.email);
  const isCognito = profile.provider === 'cognito';

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in divide-y divide-slate-800/80"
      role="menu"
      aria-label="User Profile and Settings Menu"
    >
      {/* Profile Overview Card */}
      <div className="p-4 bg-slate-950/60">
        <div className="flex items-start gap-3">
          <UserAvatar
            initials={initials}
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            isOnline={true}
            mfaEnabled={profile.mfaEnabled}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-100 truncate">
              {profile.displayName || 'Developer'}
            </div>
            <div className="text-xs text-slate-400 font-mono truncate">
              {profile.email || 'dev@lanekeeper.local'}
            </div>

            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isCognito
                    ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                    : 'bg-indigo-950/70 text-indigo-400 border-indigo-800/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCognito ? 'bg-emerald-400' : 'bg-indigo-400'
                  }`}
                />
                {isCognito ? 'AWS Cognito' : 'Local Dev'}
              </span>

              {profile.mfaEnabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-950/70 text-violet-300 border border-violet-800/60">
                  <ShieldCheck className="w-3 h-3 text-violet-400" />
                  MFA Active
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Navigation Items */}
      <div className="py-1.5 px-1 space-y-0.5 text-xs">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAppSettings('profile');
          }}
          className="w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">Profile &amp; Account</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {profile.defaultAssigneeHandle ? `@${profile.defaultAssigneeHandle}` : 'Configure'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAppSettings('themes');
          }}
          className="w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span className="font-medium">Theme &amp; Appearance</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAppSettings('features');
          }}
          className="w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="font-medium">Feature Gates</span>
          </div>
        </button>

        {onOpenHelp && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenHelp();
            }}
            className="w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-medium font-mono text-xs">`lk` cli</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
                PAT &amp; Docs
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
          </button>
        )}
      </div>

      {/* Auth State Action */}
      <div className="py-1 px-1 text-xs">
        {isCognito ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSignOut) onSignOut();
            }}
            className="w-full px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="font-medium">Sign Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAuth) onOpenAuth();
            }}
            className="w-full px-3 py-2 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/50 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">Connect AWS Cognito Account...</span>
          </button>
        )}
      </div>
    </div>
  );
};
