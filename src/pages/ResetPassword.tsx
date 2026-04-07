import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Lock, Eye, EyeOff, Ship, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);

  // Verify the oobCode on mount
  useEffect(() => {
    if (!oobCode) {
      setInvalidLink(true);
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setVerifying(false);
      })
      .catch(() => {
        setInvalidLink(true);
        setVerifying(false);
      });
  }, [oobCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords don't match.");
      return;
    }

    try {
      setLoading(true);
      await confirmPasswordReset(auth, oobCode!, password);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/expired-action-code':
            setError('This reset link has expired. Please request a new one.');
            break;
          case 'auth/invalid-action-code':
            setError('This reset link is invalid or has already been used.');
            break;
          case 'auth/weak-password':
            setError('Password is too weak. Use at least 6 characters with a mix of letters and numbers.');
            break;
          default:
            setError('Failed to reset password. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Loading state ───────────────────────────────────
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-navy-600 animate-spin mx-auto mb-4" />
          <p className="text-navy-500">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // ─── Invalid / expired link ──────────────────────────
  if (invalidLink) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative bg-navy-950 flex-col items-center justify-center p-12">
          <div className="absolute inset-0 water-pattern opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-ocean-dark" />
          <div className="relative text-center">
            <div className="flex items-center justify-center mx-auto mb-6">
              <img src="/assets/logo2.png" alt="MonStar Ship Logo" className="w-64 h-auto object-contain rounded-3xl" />
            </div>
            <h1 className="font-display text-4xl font-bold text-white mb-4">MonStar</h1>
            <p className="text-navy-300 text-lg">Ship Lines Online Ticketing</p>
          </div>
          <div className="relative mt-16 flex items-center gap-4 text-navy-400 text-xs">
            <Ship className="w-4 h-4" />
            <span>Philippines' Maritime Booking Platform</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
                <img src="/assets/logo2.png" className="w-5 h-5" alt="logo" />
              </div>
              <span className="font-display font-bold text-navy-900 text-xl">MonStar Ship</span>
            </div>

            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">Invalid reset link</h2>
            <p className="text-navy-500 mb-8">
              This password reset link is invalid, expired, or has already been used. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-block py-3 px-8 text-base">
              Request New Link
            </Link>
            <div className="mt-6 pt-6 border-t border-navy-100">
              <Link to="/auth" className="text-navy-400 hover:text-navy-600 text-sm transition-colors">
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success state ───────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative bg-navy-950 flex-col items-center justify-center p-12">
          <div className="absolute inset-0 water-pattern opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-ocean-dark" />
          <div className="relative text-center">
            <div className="flex items-center justify-center mx-auto mb-6">
              <img src="/assets/logo2.png" alt="MonStar Ship Logo" className="w-64 h-auto object-contain rounded-3xl" />
            </div>
            <h1 className="font-display text-4xl font-bold text-white mb-4">MonStar</h1>
            <p className="text-navy-300 text-lg">Ship Lines Online Ticketing</p>
          </div>
          <div className="relative mt-16 flex items-center gap-4 text-navy-400 text-xs">
            <Ship className="w-4 h-4" />
            <span>Philippines' Maritime Booking Platform</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md text-center">
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
                <img src="/assets/logo2.png" className="w-5 h-5" alt="logo" />
              </div>
              <span className="font-display font-bold text-navy-900 text-xl">MonStar Ship</span>
            </div>

            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">Password updated!</h2>
            <p className="text-navy-500 mb-8">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Link to="/auth" className="btn-primary inline-block py-3 px-8 text-base">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Reset form ──────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy-950 flex-col items-center justify-center p-12">
        <div className="absolute inset-0 water-pattern opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-ocean-dark" />
        <div className="relative text-center">
          <div className="flex items-center justify-center mx-auto mb-6">
            <img src="/assets/logo2.png" alt="MonStar Ship Logo" className="w-64 h-auto object-contain rounded-3xl" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-4">MonStar</h1>
          <p className="text-navy-300 text-lg mb-12">Ship Lines Online Ticketing</p>

          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              'Choose a strong password',
              'At least 6 characters long',
              'Mix letters, numbers & symbols',
              'Avoid reusing old passwords',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gold-400/20 border border-gold-400/40 flex items-center justify-center flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-gold-400 block" />
                </div>
                <span className="text-navy-200 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-16 flex items-center gap-4 text-navy-400 text-xs">
          <Ship className="w-4 h-4" />
          <span>Philippines' Maritime Booking Platform</span>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
              <img src="/assets/logo2.png" className="w-5 h-5" alt="logo" />
            </div>
            <span className="font-display font-bold text-navy-900 text-xl">MonStar Ship</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-navy-900 mb-2">Set new password</h2>
            <p className="text-navy-500">
              Create a new password for <span className="font-medium text-navy-700">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoFocus
                  className="w-full pl-11 pr-12 py-3 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => {
                      const strength =
                        (password.length >= 6 ? 1 : 0) +
                        (/[A-Z]/.test(password) ? 1 : 0) +
                        (/[0-9]/.test(password) ? 1 : 0) +
                        (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
                      return (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            level <= strength
                              ? strength <= 1 ? 'bg-red-400'
                              : strength <= 2 ? 'bg-amber-400'
                              : strength <= 3 ? 'bg-blue-400'
                              : 'bg-green-500'
                              : 'bg-navy-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-xs text-navy-400 mt-1">
                    {(() => {
                      const strength =
                        (password.length >= 6 ? 1 : 0) +
                        (/[A-Z]/.test(password) ? 1 : 0) +
                        (/[0-9]/.test(password) ? 1 : 0) +
                        (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
                      if (strength <= 1) return 'Weak — add numbers, uppercase, or symbols';
                      if (strength <= 2) return 'Fair — getting better';
                      if (strength <= 3) return 'Good — almost there';
                      return 'Strong password!';
                    })()}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
                />
              </div>
              {confirmPw.length > 0 && password !== confirmPw && (
                <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
              )}
              {confirmPw.length > 0 && password === confirmPw && (
                <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPw}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Resetting...
                </span>
              ) : 'Reset Password'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-navy-100 text-center">
            <Link to="/auth" className="text-navy-400 hover:text-navy-600 text-sm transition-colors">
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
