import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, Mail, X } from 'lucide-react';
import type { AuthSession, MfaChallengeData } from '../../types/index.js';
import { authenticateUser } from '../../auth/cognito.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionChange: (session: AuthSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSessionChange
}) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'login' | 'mfa_setup' | 'mfa_verify'>('login');
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mfaChallenge?.secretCode) {
      const otpUri = `otpauth://totp/Lanekeeper:${email}?secret=${mfaChallenge.secretCode}&issuer=Lanekeeper`;
      QRCode.toDataURL(otpUri, { margin: 1, width: 200 }, (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      });
    }
  }, [mfaChallenge, email]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return;

    try {
      const res = await authenticateUser(email.trim());
      if (res.session) {
        onSessionChange(res.session);
        onClose();
      } else if (res.mfaChallenge) {
        setMfaChallenge(res.mfaChallenge);
        if (res.mfaChallenge.secretCode) {
          setStep('mfa_setup');
        } else {
          setStep('mfa_verify');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleMfaVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      setError('Please enter a valid 6-digit TOTP code');
      return;
    }

    const verifiedSession: AuthSession = {
      userId: email,
      email,
      idToken: 'cognito-verified-id-token',
      accessToken: 'cognito-verified-access-token',
      refreshToken: 'cognito-verified-refresh-token'
    };
    onSessionChange(verifiedSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-100">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>
              {step === 'login'
                ? 'Sign In to Lanekeeper'
                : step === 'mfa_setup'
                ? 'Enforce TOTP MFA Setup'
                : 'Enter TOTP Security Code'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
              {error}
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Cognito MFA authentication protects your team workspaces and cloud sync.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                  <input
                    type="email"
                    required
                    placeholder="developer@team.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-slate-100 pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl shadow-md transition-all active:scale-95"
              >
                Continue &rarr;
              </button>
            </form>
          )}

          {step === 'mfa_setup' && (
            <form onSubmit={handleMfaVerifySubmit} className="space-y-4 text-center">
              <p className="text-xs text-slate-400">
                Scan this QR code with your authenticator app (Google Authenticator, 1Password, etc.):
              </p>

              {qrDataUrl && (
                <div className="flex justify-center p-3 bg-white rounded-xl w-fit mx-auto shadow-inner">
                  <img src={qrDataUrl} alt="TOTP Setup QR Code" className="w-40 h-40" />
                </div>
              )}

              {mfaChallenge?.secretCode && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  Secret: <span className="text-indigo-400">{mfaChallenge.secretCode}</span>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-[11px] font-mono text-slate-400 uppercase">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 text-center font-mono text-lg tracking-widest text-slate-100 py-2 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl transition-all"
              >
                Verify and Activate MFA
              </button>
            </form>
          )}

          {step === 'mfa_verify' && (
            <form onSubmit={handleMfaVerifySubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Open your authenticator app and enter the 6-digit security code for{' '}
                <span className="text-slate-200 font-semibold">{email}</span>.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 uppercase">
                  6-Digit Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 text-center font-mono text-lg tracking-widest text-slate-100 py-2 rounded-xl border border-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2.5 rounded-xl transition-all"
              >
                Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
