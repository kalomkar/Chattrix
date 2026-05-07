import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  enterToSend: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'dark' | 'light';
  glassEffect: boolean;
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
  messagePreview: boolean;
  autoDownloadWiFi: boolean;
  autoDownloadMobile: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  enterToSend: true,
  fontSize: 'medium',
  theme: 'dark',
  glassEffect: true,
  notifications: true,
  sound: true,
  vibration: true,
  messagePreview: true,
  autoDownloadWiFi: true,
  autoDownloadMobile: false,
};

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('nexus_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('nexus_settings', JSON.stringify(settings));
    
    // Apply Font Size class to body or root
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${settings.fontSize}`);
    
    // Apply Theme
    const isDark = settings.theme === 'dark';
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Smooth transition for theme change
    root.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
  }, [settings]);

  // Listen for system theme changes if no preference is set in future 
  // (Optional: can be added here if we want to follow system)

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
