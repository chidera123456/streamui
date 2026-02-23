
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as { MSStream?: unknown };
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !win.MSStream;
  });

  const [isMacSafari] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return /Macintosh/i.test(ua) && /Safari/i.test(ua) && !/Chrome/i.test(ua) && !/Edg/i.test(ua);
  });

  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    const nav = window.navigator as unknown as { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches 
      || nav.standalone 
      || document.referrer.includes('android-app://');
  });

  useEffect(() => {
    if (isStandalone) return;

    // Listen for beforeinstallprompt (Android & Desktop Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS or Mac Safari, show prompt if not standalone
    if (isIOS || isMacSafari) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone, isIOS, isMacSafari]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !showPrompt) return null;

  const getTitle = () => {
    if (isIOS) return "Install ZenStream";
    if (isMacSafari) return "ZenStream for Mac";
    if (!isMobile) return "ZenStream for Desktop";
    return "Install ZenStream";
  };

  const getDescription = () => {
    if (isIOS) return "Install ZenStream on your iPhone for a full-screen cinematic experience.";
    if (isMacSafari) return "Add ZenStream to your Dock for a native app experience on your Mac.";
    if (!isMobile) return "Get the desktop app for a faster, distraction-free experience directly from your dock or taskbar.";
    return "Download the app for a faster, full-screen experience without the browser bar.";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[100]"
      >
        <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
          <button 
            onClick={() => setShowPrompt(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1ce783]/10 flex items-center justify-center shrink-0">
              <Download className="text-[#1ce783]" size={24} />
            </div>
            
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {getTitle()}
              </h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                {getDescription()}
              </p>
            </div>
          </div>

          <div className="mt-5">
            {isIOS ? (
              <div className="bg-white/5 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[#1ce783]">1</span>
                  <span>Tap the <Share size={14} className="inline mx-1 text-[#1ce783]" /> Share button</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[#1ce783]">2</span>
                  <span>Select <PlusSquare size={14} className="inline mx-1 text-[#1ce783]" /> 'Add to Home Screen'</span>
                </div>
              </div>
            ) : isMacSafari ? (
              <div className="bg-white/5 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[#1ce783]">1</span>
                  <span>Go to <span className="text-white font-bold">File</span> in the top menu bar</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300">
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[#1ce783]">2</span>
                  <span>Select <span className="text-white font-bold">'Add to Dock...'</span></span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full bg-[#1ce783] text-black py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-lg shadow-[#1ce783]/20"
              >
                Install App
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
