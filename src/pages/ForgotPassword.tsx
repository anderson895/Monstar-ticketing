import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Mail, ArrowLeft, Ship, CheckCircle } from 'lucide-react';
import { FirebaseError } from 'firebase/app';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setError('');

      await sendPasswordResetEmail(auth, email);

      setSent(true);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
            setSent(true); // don't reveal if email exists
            return;
          case 'auth/invalid-email':
            setError('Invalid email address format.');
            break;
          case 'auth/too-many-requests':
            setError('Too many attempts. Please wait a few minutes and try again.');
            break;
          case 'auth/unauthorized-continue-uri':
            setError('Configuration error: reset domain not authorized. Contact support.');
            break;
          case 'auth/missing-continue-uri':
          case 'auth/invalid-continue-uri':
            setError('Configuration error with reset link. Contact support.');
            break;
          case 'auth/network-request-failed':
            setError('Network error. Please check your connection and try again.');
            break;
          default:
            setError(`An unexpected error occurred (${err.code}). Please try again.`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

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
              'Secure password recovery',
              'Reset link sent to your email',
              'Set a new password instantly',
              'Get back to booking in minutes',
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

          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-display text-3xl font-bold text-navy-900 mb-3">Check your email</h2>
              <p className="text-navy-500 mb-2">
                We've sent a password reset link to
              </p>
              <p className="font-medium text-navy-800 mb-6">{email}</p>
              <div className="bg-navy-50 rounded-xl p-4 mb-8 text-left">
                <p className="text-navy-600 text-sm leading-relaxed">
                  <span className="font-semibold">Tip:</span> Check your spam or junk folder if you don't see the email within a few minutes. The link will expire in 1 hour.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-navy-600 hover:text-navy-800 text-sm font-medium transition-colors underline"
                >
                  Try a different email
                </button>
                <div>
                  <Link to="/auth" className="btn-primary inline-block py-3 px-8 text-base">
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold text-navy-900 mb-2">Forgot password?</h2>
                <p className="text-navy-500">
                  No worries! Enter your email address and we'll send you a secure link to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/auth" className="inline-flex items-center gap-2 text-navy-500 hover:text-navy-700 text-sm transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-navy-100 text-center">
            <Link to="/" className="text-navy-400 hover:text-navy-600 text-sm transition-colors">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}