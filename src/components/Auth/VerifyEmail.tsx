import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, MessageCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0f1117] font-sans text-white relative">
      <div className="fixed inset-0 z-0">
          <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#2563FF]/10 rounded-full blur-[160px]" />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#00d26a]/10 rounded-full blur-[140px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] p-10 rounded-[32px] bg-[#1a1d26]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 text-center"
      >
        <div className="w-16 h-16 bg-[#00d26a]/10 rounded-2xl flex items-center justify-center mx-auto mb-8 ring-1 ring-[#00d26a]/20">
          <MessageCircle className="text-[#00d26a] w-8 h-8" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-[#00d26a] animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2">Verifying Email...</h2>
            <p className="text-[#b3b3b3]">Initializing secure protocol...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-[#00d26a] mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2">Email Verified</h2>
            <p className="text-[#b3b3b3] mb-8">{message}</p>
            <Link to="/login" className="block w-full bg-[#00d26a] text-[#0f1117] font-black py-4 rounded-xl transition-all shadow-lg shadow-[#00d26a]/20">Sign In Now</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2">Verification Failed</h2>
            <p className="text-[#b3b3b3] mb-8">{message}</p>
            <Link to="/login" className="block w-full bg-white/5 text-white font-black py-4 rounded-xl hover:bg-white/10 transition-all">Back to Home</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
