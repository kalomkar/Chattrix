import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { MessageCircle, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { GoogleAuthProvider, signInWithPopup, GithubAuthProvider } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
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

  const handleSocialLogin = async (provider: any) => {
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0f1117] font-sans text-white overflow-hidden relative">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
          <motion.div 
            animate={{ 
              x: [0, 50, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-[#2563FF]/20 rounded-full blur-[160px]" 
          />
          <motion.div 
            animate={{ 
              x: [0, -50, 0],
              y: [0, -100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#00d26a]/15 rounded-full blur-[140px]" 
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      <div className="w-full max-w-[1000px] grid md:grid-cols-2 gap-12 items-center z-10">
          {/* Left Side: Branding / Marketing */}
          <div className="hidden md:block py-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                  <h1 className="text-6xl font-black tracking-tighter mb-6 leading-tight">
                    Welcome to <span className="text-[#00d26a]">Chattrix</span>.
                  </h1>
                  <p className="text-xl text-[#b3b3b3] mb-8 leading-relaxed max-w-md">
                    Experience the future of communication. Secure, private, and powered by neural networks.
                  </p>
                  <div className="flex gap-4">
                      <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 w-40">
                          <p className="text-[#00d26a] font-black text-2xl">100%</p>
                          <p className="text-xs text-[#b3b3b3] uppercase tracking-widest font-bold">Secure</p>
                      </div>
                      <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 w-40">
                          <p className="text-[#2563FF] font-black text-2xl">Ultra</p>
                          <p className="text-xs text-[#b3b3b3] uppercase tracking-widest font-bold">Fast</p>
                      </div>
                  </div>
              </motion.div>
          </div>

          {/* Right Side: Auth Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[440px] p-8 md:p-10 rounded-[32px] bg-[#1a1d26]/60 backdrop-blur-2xl border border-white/10 shadow-2xl mx-auto md:mx-0"
          >
            <div className="text-center mb-10">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 bg-[#00d26a]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#00d26a]/20"
              >
                <MessageCircle className="text-[#00d26a] w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-black tracking-tight mb-2">
                {isLogin ? "Sign In" : "Get Started"}
              </h2>
              <p className="text-[#b3b3b3] text-sm">
                Enter your credentials to continue.
              </p>
            </div>

        <AnimatePresence mode="wait">
          {verificationSent ? (
            <motion.div
              key="verification-sent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <CheckCircle2 className="text-[#00d26a] w-16 h-16 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-3">Check your inbox</h2>
              <p className="text-[#b3b3b3] text-sm mb-8">Verification link sent to {email}</p>
              <button onClick={() => setVerificationSent(false)} className="text-[#00d26a] font-bold">Back to Login</button>
            </motion.div>
          ) : (
            <motion.form 
              key="auth-form"
              onSubmit={handleEmailSubmit} 
              className="space-y-4"
            >
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 text-white/20" size={18} />
                    <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[#0f1117] border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="John Doe" />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-white/20" size={18} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0f1117] border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="name@example.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-white/20" size={18} />
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0f1117] border border-white/5 rounded-xl p-4 pl-12 pr-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-white/20 hover:text-white">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 text-white/20" size={18} />
                    <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#0f1117] border border-white/5 rounded-xl p-4 pl-12 pr-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="••••••••" />
                  </div>
                </div>
              )}

              {error && <p className="text-red-400 text-xs text-center">{error}</p>}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-[#00d26a] text-[#0f1117] font-black py-4 rounded-xl transition-all shadow-lg shadow-[#00d26a]/20 flex items-center justify-center"
              >
                {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {!verificationSent && (
            <div className="mt-8">
                <div className="relative flex items-center gap-4 text-xs font-bold uppercase text-[#b3b3b3] mb-6">
                    <div className="flex-1 h-px bg-white/5" /> OR <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleSocialLogin(googleProvider)} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl text-center text-xs font-bold">Google</button>
                    <button onClick={() => handleSocialLogin(githubProvider)} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl text-center text-xs font-bold">GitHub</button>
                </div>
                <p className="mt-8 text-center text-xs font-bold text-[#b3b3b3]">
                    {isLogin ? "New here?" : "Already have an account?"}
                    <button onClick={() => setIsLogin(!isLogin)} className="text-[#00d26a] ml-1">
                        {isLogin ? "Create an account" : "Sign In"}
                    </button>
                </p>
            </div>
        )}
      </motion.div>
    </div>
    </div>
  );
}
