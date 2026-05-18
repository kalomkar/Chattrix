import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Phone, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'register' && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (mode !== 'forgot' && !captchaVerified) {
      setError("Please verify the CAPTCHA");
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ loginIdentifier: email || username, password });
      } else if (mode === 'register') {
        await register({ fullName, username, email, phoneNumber, password });
        setSuccessMessage("Registration successful! Please check your email to verify your account.");
      } else if (mode === 'forgot') {
        const api = (await import('../../services/api')).default;
        await api.post('/auth/forgot-password', { email });
        setSuccessMessage("Reset link sent to your email. Please check your inbox.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || "An error occurred");
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
          {/* Left Side: Branding */}
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
                    The most secure and premium chat experience, now powered by advanced SQL backend and JWT protocols.
                  </p>
                  <div className="flex gap-4">
                      <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 w-40">
                          <p className="text-[#00d26a] font-black text-2xl">SQL</p>
                          <p className="text-xs text-[#b3b3b3] uppercase tracking-widest font-bold">Reliable</p>
                      </div>
                      <div className="bg-[#1a1d26] p-4 rounded-2xl border border-white/5 w-40">
                          <p className="text-[#2563FF] font-black text-2xl">JWT</p>
                          <p className="text-xs text-[#b3b3b3] uppercase tracking-widest font-bold">Secure</p>
                      </div>
                  </div>
              </motion.div>
          </div>

          {/* Right Side: Auth Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[480px] p-8 md:p-10 rounded-[32px] bg-[#1a1d26]/60 backdrop-blur-2xl border border-white/10 shadow-2xl mx-auto md:mx-0 overflow-y-auto max-h-[90vh] custom-scrollbar"
          >
            <div className="text-center mb-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-16 h-16 bg-[#00d26a]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#00d26a]/20"
              >
                <MessageCircle className="text-[#00d26a] w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-black tracking-tight mb-2">
                {mode === 'login' ? "Sign In" : mode === 'register' ? "Create Account" : "Reset Password"}
              </h2>
              <p className="text-[#b3b3b3] text-sm">
                {mode === 'login' ? "Access your premium dashboard." : mode === 'register' ? "Join the luxury communication suite." : "Recover your security access."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {successMessage ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-6"
                >
                  <CheckCircle2 className="text-[#00d26a] w-16 h-16 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-3">Protocol Executed</h2>
                  <p className="text-[#b3b3b3] text-sm mb-8">{successMessage}</p>
                  <button onClick={() => { setSuccessMessage(''); setMode('login'); }} className="text-[#00d26a] font-black uppercase text-sm">Return to Login</button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                  {mode === 'register' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-4 text-white/20" size={18} />
                          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#0f1117]/50 border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="John Doe" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Username</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-4 text-white/20" size={18} />
                          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#0f1117]/50 border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="johndoe123" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-4 text-white/20" size={18} />
                          <input type="tel" required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-[#0f1117]/50 border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="+1 234 567 890" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">{mode === 'login' ? "Email or Username" : "Email Address"}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 text-white/20" size={18} />
                      <input type="text" required value={(mode === 'login' && !email) ? username : email} onChange={(e) => { 
                        if(mode === 'login') {
                           if(e.target.value.includes('@')) setEmail(e.target.value);
                           else setUsername(e.target.value);
                        } else setEmail(e.target.value);
                      }} className="w-full bg-[#0f1117]/50 border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="name@example.com" />
                    </div>
                  </div>

                  {mode !== 'forgot' && (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-xs font-bold uppercase text-[#b3b3b3]">Password</label>
                          {mode === 'login' && (
                            <button type="button" onClick={() => setMode('forgot')} className="text-xs text-[#2563FF] font-bold hover:underline">Forgot?</button>
                          )}
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-4 text-white/20" size={18} />
                          <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0f1117]/50 border border-white/5 rounded-xl p-4 pl-12 pr-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-white/20 hover:text-white">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {mode === 'register' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Confirm Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-4 text-white/20" size={18} />
                            <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#0f1117]/50 border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" placeholder="••••••••" />
                          </div>
                        </div>
                      )}

                      {/* Mock CAPTCHA */}
                      <div className="bg-[#0f1117]/80 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                          <input 
                            type="checkbox" 
                            checked={captchaVerified} 
                            onChange={(e) => setCaptchaVerified(e.target.checked)}
                            className="w-5 h-5 rounded bg-white/10 accent-[#00d26a]"
                          />
                          <span className="text-xs font-bold uppercase text-[#b3b3b3]">I'm not a robot</span>
                          <div className="ml-auto w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                              <CheckCircle2 size={16} className={captchaVerified ? "text-[#00d26a]" : "text-white/10"} />
                          </div>
                      </div>
                    </>
                  )}

                  {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-[#00d26a] to-[#00b05a] text-[#0f1117] font-black py-4 rounded-xl transition-all shadow-lg shadow-[#00d26a]/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-[#0f1117]/20 border-t-[#0f1117] rounded-full animate-spin" />
                    ) : mode === 'login' ? "Sign In" : mode === 'register' ? "Create Account" : "Send Reset Link"}
                  </motion.button>

                  <div className="text-center mt-6">
                    <p className="text-xs font-bold text-[#b3b3b3] mb-2 uppercase tracking-widest">
                       {mode === 'login' ? "New to the luxury suite?" : "Return to security check?"}
                    </p>
                    <button 
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')} 
                      className="text-[#00d26a] font-black uppercase text-sm hover:underline tracking-tighter"
                    >
                        {mode === 'login' ? "Request Invitation / Register" : "Secure Login"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
      </div>
    </div>
  );
}
