import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { MessageCircle, ShieldCheck, Phone, Mail, ChevronLeft, Ghost, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Email fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Phone fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    // Cleanup recaptcha on unmount
    return () => {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (confirmationResult) {
        await confirmationResult.confirm(verificationCode);
      }
    } catch (err: any) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError("Please verify your email before logging in. Check your inbox.");
          // Optional: allow resend or just keep them logged out
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden p-4">
      <div className="mesh-bg" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 glass rounded-[2.5rem] shadow-2xl relative z-10 backdrop-blur-3xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-900/40 rotate-3 group hover:rotate-0 transition-transform duration-500">
            <Ghost className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-black dark:text-white tracking-tight">Chattrix</h1>
          <p className="text-black/40 dark:text-white/40 text-center mt-2 text-sm font-medium">
            Privacy first. Real-time always.
          </p>
        </div>

        <div id="recaptcha-container"></div>

        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl mb-8 border border-black/5 dark:border-white/5">
          <button 
            onClick={() => { setAuthMethod('email'); setConfirmationResult(null); }}
            className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2", authMethod === 'email' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-lg" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white")}
          >
            <Mail size={14} />
            Email
          </button>
          <button 
            onClick={() => { setAuthMethod('phone'); setIsLogin(true); }}
            className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2", authMethod === 'phone' ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-lg" : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white")}
          >
            <Phone size={14} />
            Phone
          </button>
        </div>

        <AnimatePresence mode="wait">
          {verificationSent ? (
            <motion.div
              key="verification-sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-emerald-500 w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verify your email</h2>
              <p className="text-white/60 text-sm mb-8 px-4">
                We've sent a confirmation link to <span className="text-white font-bold">{email}</span>. Please click the link to activate your account.
              </p>
              <button
                onClick={() => setVerificationSent(false)}
                className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest"
              >
                Back to Login
              </button>
            </motion.div>
          ) : authMethod === 'email' ? (
            <motion.form 
              key="email-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleEmailSubmit} 
              className="space-y-4"
            >
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-black/40 dark:text-white/40 ml-1">Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-black dark:text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-black/20 dark:placeholder-white/20"
                    placeholder="Marcus Chen"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-black/40 dark:text-white/40 ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-black dark:text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-black/20 dark:placeholder-white/20"
                  placeholder="marcus@nexus.chat"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-black/40 dark:text-white/40 ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-black dark:text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-black/20 dark:placeholder-white/20"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-400 text-xs font-medium pl-1">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all mt-4 disabled:opacity-50 shadow-lg shadow-blue-900/30 active:scale-95"
              >
                {loading ? 'Authenticating...' : isLogin ? 'Login Now' : 'Create Account'}
              </button>
            </motion.form>
          ) : (
            <motion.div 
               key="phone-form"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="space-y-4"
            >
              {!confirmationResult ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-blue-500/50 outline-none transition-all placeholder-white/20"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs font-medium pl-1">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all mt-4 disabled:opacity-50 shadow-lg shadow-blue-900/30 active:scale-95"
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <button 
                    type="button" 
                    onClick={() => setConfirmationResult(null)}
                    className="text-white/40 hover:text-white text-xs flex items-center gap-1 mb-2"
                  >
                    <ChevronLeft size={14} /> Back to phone
                  </button>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/40 ml-1">OTP Code</label>
                    <input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-center tracking-[1em] font-black text-xl focus:border-blue-500/50 outline-none transition-all placeholder-white/10"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs font-medium pl-1">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all mt-4 disabled:opacity-50 shadow-lg shadow-blue-900/30 active:scale-95"
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {authMethod === 'email' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 text-xs font-bold tracking-tight"
            >
              {isLogin ? "DON'T HAVE AN ACCOUNT? SIGN UP" : "ALREADY HAVE AN ACCOUNT? LOGIN"}
            </button>
          </div>
        )}

        <div className="mt-10 flex items-center justify-center space-x-2 text-white/20 text-[10px] font-bold uppercase tracking-widest">
          <ShieldCheck size={12} />
          <span>Military Grade Protection</span>
        </div>
      </motion.div>
    </div>
  );
}
