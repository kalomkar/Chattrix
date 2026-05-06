import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { StoryProvider } from './context/StoryContext';
import { SettingsProvider } from './context/SettingsContext';
import MainLayout from './components/Layout/MainLayout';
import AuthPage from './components/Auth/AuthPage';
import { motion } from 'motion/react';

function AppContent() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0B0E11] text-white font-display overflow-hidden relative">
        <div className="mesh-bg opacity-30" />
        <div className="relative z-10 flex flex-col items-center">
           <motion.div 
             animate={{ 
               scale: [1, 1.1, 1],
               rotate: [0, 90, 0]
             }}
             transition={{ duration: 4, repeat: Infinity }}
             className="w-20 h-20 border-t-2 border-r-2 border-emerald-500 rounded-[2rem] flex items-center justify-center mb-8"
           >
              <div className="w-10 h-10 border-b-2 border-l-2 border-emerald-500/30 rounded-2xl animate-pulse" />
           </motion.div>
           <h1 className="text-2xl font-black tracking-[0.4em] text-white uppercase mb-2">Chattrix</h1>
           <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-100" />
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-200" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-8">Establishing Secure Protocol</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#0B0E11] overflow-hidden selection:bg-emerald-500/30">
      {currentUser ? (
        <SettingsProvider>
          <ChatProvider>
            <StoryProvider>
              <CallProvider>
                <MainLayout />
              </CallProvider>
            </StoryProvider>
          </ChatProvider>
        </SettingsProvider>
      ) : (
        <AuthPage />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
