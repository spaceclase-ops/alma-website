import React, { useState, useEffect } from 'react';
import Button from './Button';

interface CookiePreferences {
  essential: boolean;
  statistics: boolean;
  marketing: boolean;
}

const CookieConsent: React.FC<{ onOpenPreferences?: () => void }> = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    statistics: false,
    marketing: false
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie_consent_state');
    if (!savedConsent) {
      setIsVisible(true);
    }
    
    // Listen for custom event to reopen preferences from footer
    const handleReopen = () => {
      setShowPreferences(true);
      setIsVisible(true);
    };
    window.addEventListener('reopen-cookie-settings', handleReopen);
    return () => window.removeEventListener('reopen-cookie-settings', handleReopen);
  }, []);

  const saveConsent = (updatedPrefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent_state', JSON.stringify({
      ...updatedPrefs,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
    setShowPreferences(false);
    
    // Trigger script loading logic here if needed
    if (updatedPrefs.statistics) {
      console.log('Loading statistics scripts...');
    }
    if (updatedPrefs.marketing) {
      console.log('Loading marketing scripts...');
    }
  };

  const handleAcceptAll = () => {
    const allIn = { essential: true, statistics: true, marketing: true };
    setPrefs(allIn);
    saveConsent(allIn);
  };

  const handleDeclineAll = () => {
    const min = { essential: true, statistics: false, marketing: false };
    setPrefs(min);
    saveConsent(min);
  };

  const handleSaveCustom = () => {
    saveConsent(prefs);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 bg-white border-t border-gray-200 shadow-2xl animate-slide-up" role="dialog" aria-labelledby="cookie-title">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1">
          <h2 id="cookie-title" className="text-xl font-bold text-alma-dark mb-2">שימוש בעוגיות באתר</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            אנו משתמשים בעוגיות כדי לשפר את חווית הגלישה שלך, לספק תוכן מותאם אישית ולנתח את תנועת הגולשים באתר. למידע נוסף, ניתן לעיין ב
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('nav-legal', { detail: 'cookie-policy' }))}
              className="text-alma-primary underline mx-1"
            >
              מדיניות העוגיות
            </button> 
            שלנו.
          </p>
        </div>

        {!showPreferences ? (
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={handleAcceptAll} className="px-6 py-2 text-sm">אישור כל העוגיות</Button>
            <Button onClick={() => setShowPreferences(true)} variant="outline" className="px-6 py-2 text-sm">ניהול העדפות</Button>
            <Button onClick={handleDeclineAll} variant="white" className="px-6 py-2 text-sm border border-gray-200">דחייה</Button>
          </div>
        ) : (
          <div className="w-full md:w-auto space-y-4">
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-not-allowed opacity-70">
                <input type="checkbox" checked disabled className="w-5 h-5 text-alma-primary rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">חיוניות (חובה לתפקוד האתר)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={prefs.statistics} 
                  onChange={(e) => setPrefs({...prefs, statistics: e.target.checked})}
                  className="w-5 h-5 text-alma-primary rounded border-gray-300 focus:ring-alma-primary" 
                />
                <span className="text-sm font-medium text-gray-700">סטטיסטיקה (לצורך שיפור ביצועי האתר)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={prefs.marketing} 
                  onChange={(e) => setPrefs({...prefs, marketing: e.target.checked})}
                  className="w-5 h-5 text-alma-primary rounded border-gray-300 focus:ring-alma-primary" 
                />
                <span className="text-sm font-medium text-gray-700">שיווק (להתאמת מודעות ותכנים)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveCustom} className="flex-1 md:flex-none px-6 py-2 text-sm">שמירת העדפות</Button>
              <Button onClick={() => setShowPreferences(false)} variant="outline" className="flex-1 md:flex-none px-6 py-2 text-sm">חזרה</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;