import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const PRIVACY_MODE_KEY = 'moneytrack-privacy-mode';

interface PrivacyModeContextValue {
  privacyMode: boolean;
  setPrivacyMode: (enabled: boolean) => void;
}

const PrivacyModeContext = createContext<PrivacyModeContextValue | null>(null);

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyModeState] = useState(() => localStorage.getItem(PRIVACY_MODE_KEY) === 'true');

  const setPrivacyMode = (enabled: boolean) => {
    setPrivacyModeState(enabled);
    localStorage.setItem(PRIVACY_MODE_KEY, String(enabled));
  };

  const value = useMemo(() => ({ privacyMode, setPrivacyMode }), [privacyMode]);
  return <PrivacyModeContext.Provider value={value}>{children}</PrivacyModeContext.Provider>;
}

export function usePrivacyMode() {
  const context = useContext(PrivacyModeContext);
  if (!context) throw new Error('usePrivacyMode must be used within PrivacyModeProvider');
  return context;
}
