import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, MessageCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0f1117] font-sans text-white relative">
      <div className="fixed inset-0 z-0">
          <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#2563FF]/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#00d26a]/10 rounded-full blur-[140px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] p-10 rounded-[32px] bg-[#1a1d26]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00d26a]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#00d26a]/20">
            <MessageCircle className="text-[#00d26a] w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">Reset Password</h2>
          <p className="text-[#b3b3b3] text-sm">Secure authorization recovery</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <CheckCircle2 className="text-[#00d26a] w-16 h-16 mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-3">Password Updated</h2>
              <p className="text-[#b3b3b3] text-sm mb-8">Your security credentials have been successfully reset.</p>
              <Link to="/login" className="block w-full bg-[#00d26a] text-[#0f1117] font-black py-4 rounded-xl transition-all shadow-lg shadow-[#00d26a]/20">Back to Login</Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-white/20" size={18} />
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0f1117] border border-white/5 rounded-xl p-4 pl-12 pr-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-white/20 hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#b3b3b3] ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-white/20" size={18} />
                  <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-[#0f1117] border border-white/5 rounded-xl p-4 pl-12 text-sm focus:border-[#00d26a]/50 outline-none transition-all" />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs text-center font-bold">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00d26a] text-[#0f1117] font-black py-4 rounded-xl transition-all shadow-lg shadow-[#00d26a]/20 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Confirm Reset"}
              </button>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
