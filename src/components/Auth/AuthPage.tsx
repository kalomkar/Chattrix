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
    <div className="h-screen w-full flex items-center justify-center relative overflow-hidden p-4 bg-[#2F3443]">
      <div className="mesh-bg opacity-30" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 glass rounded-[2rem] shadow-2xl relative z-10 backdrop-blur-2xl border-white/10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-600/30 ring-1 ring-white/20"
          >
            <Ghost className="text-white w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm font-display">Chattrix</h1>
          <p className="text-[#C7CAD1] text-center mt-3 text-sm font-medium opacity-90 tracking-wide">
            Privacy first. Real-time always.
          </p>
        </div>

        <div id="recaptcha-container"></div>

        <div className="flex p-1.5 bg-[#3A4052] rounded-2xl mb-8 border border-white/5">
          <button 
            onClick={() => { setAuthMethod('email'); setConfirmationResult(null); }}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2", 
              authMethod === 'email' 
                ? "bg-white text-[#2F3443] shadow-lg scale-[1.02]" 
                : "text-[#C7CAD1] hover:text-white hover:bg-white/5"
            )}
          >
            <Mail size={14} strokeWidth={2.5} />
            Email
          </button>
          <button 
            onClick={() => { setAuthMethod('phone'); setIsLogin(true); }}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2", 
              authMethod === 'phone' 
                ? "bg-white text-[#2F3443] shadow-lg scale-[1.02]" 
                : "text-[#C7CAD1] hover:text-white hover:bg-white/5"
            )}
          >
            <Phone size={14} strokeWidth={2.5} />
            Phone
          </button>
        </div>

        <AnimatePresence mode="wait">
          {verificationSent ? (
            <motion.div
              key="verification-sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="text-emerald-500 w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Check your inbox</h2>
              <p className="text-[#C7CAD1] text-sm mb-8 leading-relaxed">
                We've sent a verification link to <br/>
                <span className="text-white font-bold text-base block mt-1">{email}</span>
              </p>
              <button
                onClick={() => setVerificationSent(false)}
                className="text-[#2563FF] hover:text-blue-400 text-sm font-bold uppercase tracking-widest transition-colors"
              >
                Back to Login
              </button>
            </motion.div>
          ) : authMethod === 'email' ? (
            <motion.form 
              key="email-form"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleEmailSubmit} 
              className="space-y-6"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs uppercase font-extrabold tracking-widest text-white/70 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#3A4052] border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#2563FF] focus:ring-2 focus:ring-[#2563FF]/20 outline-none transition-all placeholder-[#9AA0AE]"
                    placeholder="e.g. John Doe"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-widest text-white/70 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#3A4052] border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#2563FF] focus:ring-2 focus:ring-[#2563FF]/20 outline-none transition-all placeholder-[#9AA0AE]"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-extrabold tracking-widest text-white/70 ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#3A4052] border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#2563FF] focus:ring-2 focus:ring-[#2563FF]/20 outline-none transition-all placeholder-[#9AA0AE]"
                  placeholder="Enter your password"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                >
                  <p className="text-red-400 text-xs font-semibold text-center leading-snug">{error}</p>
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-[#2563FF] to-blue-500 text-white font-bold py-4 rounded-2xl transition-all mt-4 disabled:opacity-50 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </motion.button>
            </motion.form>
          ) : (
            <motion.div 
               key="phone-form"
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               transition={{ duration: 0.3 }}
               className="space-y-6"
            >
              {!confirmationResult ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-extrabold tracking-widest text-white/70 ml-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#3A4052] border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-[#2563FF] focus:ring-2 focus:ring-[#2563FF]/20 outline-none transition-all placeholder-[#9AA0AE]"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-xs font-semibold text-center leading-snug">{error}</p>
                    </div>
                  )}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-[#2563FF] to-blue-500 text-white font-bold py-4 rounded-2xl transition-all mt-4 disabled:opacity-50 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Send Verification Code'}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <button 
                    type="button" 
                    onClick={() => setConfirmationResult(null)}
                    className="text-[#C7CAD1] hover:text-white text-sm flex items-center gap-2 mb-4 font-bold group transition-colors"
                  >
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> 
                    Back to phone
                  </button>
                  <div className="space-y-3 text-center">
                    <label className="text-xs uppercase font-extrabold tracking-widest text-white/70">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-[#3A4052] border border-white/10 rounded-2xl p-5 text-white text-center tracking-[0.5em] font-black text-2xl focus:border-[#2563FF] focus:ring-2 focus:ring-[#2563FF]/20 outline-none transition-all placeholder-[#9AA0AE]/30"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <p className="text-red-400 text-xs font-semibold text-center leading-snug">{error}</p>
                    </div>
                  )}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-[#2563FF] to-blue-500 text-white font-bold py-4 rounded-2xl transition-all mt-4 disabled:opacity-50 shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Verify & Continue'}
                  </motion.button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {authMethod === 'email' && !verificationSent && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#2563FF] hover:text-blue-400 text-xs font-extrabold tracking-widest uppercase transition-colors"
            >
              {isLogin ? "Need an account? Sign Up" : "Have an account? Sign In"}
            </button>
          </div>
        )}

        <div className="mt-12 flex items-center justify-center space-x-2 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] border-t border-white/5 pt-8">
          <ShieldCheck size={14} className="text-blue-500/50" />
          <span>Military Grade Protection</span>
        </div>
      </motion.div>

      <div className="fixed bottom-8 text-white/20 text-xs font-medium tracking-wide">
        &copy; 2024 Chattrix Inc. All rights reserved.
      </div>
    </div>
  );
}
