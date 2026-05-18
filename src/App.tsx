import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';
import { StoryProvider } from './context/StoryContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import MainLayout from './components/Layout/MainLayout';
import AuthPage from './components/Auth/AuthPage';
import VerifyEmail from './components/Auth/VerifyEmail';
import ResetPassword from './components/Auth/ResetPassword';
import { motion } from 'motion/react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/login" />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0f1117] text-black dark:text-white font-display overflow-hidden relative transition-colors duration-300">
      <div className="mesh-bg opacity-30 select-none pointer-events-none" />
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
         <h1 className="text-2xl font-black tracking-[0.4em] text-black dark:text-white uppercase mb-2">Chattrix</h1>
         <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-100" />
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce delay-200" />
         </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <div className="dark h-screen w-full bg-[#0f1117] overflow-hidden selection:bg-emerald-500/30 transition-colors duration-300">
      <Routes>
        <Route path="/login" element={!currentUser ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <ChatProvider>
                <StoryProvider>
                  <CallProvider>
                    <MainLayout />
                  </CallProvider>
                </StoryProvider>
              </ChatProvider>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}
