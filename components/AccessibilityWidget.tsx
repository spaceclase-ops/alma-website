
import React, { useState, useEffect, useRef } from 'react';
import { Accessibility, X, Type, Contrast, MousePointer2, RefreshCw, EyeOff, ALargeSmall } from 'lucide-react';

const AccessibilityWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    textSize: 'normal',
    highContrast: false,
    grayscale: false,
    readableFont: false,
    highlightLinks: false,
  });

  // Position state
  const [position, setPosition] = useState({ x: -1, y: -1 }); // -1 means initial default
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Initialize position to bottom-right on mount
  useEffect(() => {
    const initialX = window.innerWidth - 80;
    const initialY = window.innerHeight - 80;
    setPosition({ x: initialX, y: initialY });
    widgetPos.current = { x: initialX, y: initialY };
  }, []);

  // Handle window resize to keep button inside
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const newX = Math.min(prev.x, window.innerWidth - 60);
        const newY = Math.min(prev.y, window.innerHeight - 60);
        widgetPos.current = { x: newX, y: newY };
        return { x: newX, y: newY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load accessibility settings
  useEffect(() => {
    const saved = localStorage.getItem('alma_accessibility_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        applySettings(parsed);
      } catch (e) {
        console.error("Failed to load accessibility settings");
      }
    }
  }, []);

  const applySettings = (newSettings: typeof settings) => {
    const body = document.body;
    body.classList.toggle('acc-high-contrast', newSettings.highContrast);
    body.classList.toggle('acc-grayscale', newSettings.grayscale);
    body.classList.toggle('acc-readable-font', newSettings.readableFont);
    body.classList.toggle('acc-highlight-links', newSettings.highlightLinks);
    
    body.classList.remove('acc-text-large', 'acc-text-xlarge');
    if (newSettings.textSize === 'large') body.classList.add('acc-text-large');
    if (newSettings.textSize === 'xlarge') body.classList.add('acc-text-xlarge');
    
    localStorage.setItem('alma_accessibility_settings', JSON.stringify(newSettings));
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings = {
      textSize: 'normal',
      highContrast: false,
      grayscale: false,
      readableFont: false,
      highlightLinks: false,
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  // Drag Handlers
  const onStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    hasMoved.current = false;
    dragStartPos.current = { x: clientX - widgetPos.current.x, y: clientY - widgetPos.current.y };
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    hasMoved.current = true;
    
    let newX = clientX - dragStartPos.current.x;
    let newY = clientY - dragStartPos.current.y;

    // Boundaries
    newX = Math.max(10, Math.min(newX, window.innerWidth - 70));
    newY = Math.max(10, Math.min(newY, window.innerHeight - 70));

    widgetPos.current = { x: newX, y: newY };
    setPosition({ x: newX, y: newY });
  };

  const onEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleMouseUp = () => onEnd();
    const handleTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchEnd = () => onEnd();

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  const toggleMenu = () => {
    // Only toggle if we didn't just drag
    if (!hasMoved.current) {
      setIsOpen(!isOpen);
    }
  };

  // If position hasn't been initialized yet, don't render to avoid flickering
  if (position.x === -1) return null;

  return (
    <div 
      className="fixed z-[9999] flex flex-col items-end pointer-events-none"
      style={{ left: position.x, top: position.y }}
    >
      {/* Menu Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden pointer-events-auto" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Accessibility Menu */}
      <div className={`absolute bottom-full right-0 mb-4 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 transform origin-bottom-right pointer-events-auto ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-alma-dark text-white p-5 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Accessibility size={20} className="text-alma-primary" />
            תפריט נגישות
          </h3>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <div className="p-3 bg-gray-50 rounded-2xl">
            <p className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
              <Type size={14} /> גודל טקסט
            </p>
            <div className="flex gap-2">
              {['normal', 'large', 'xlarge'].map((size) => (
                <button 
                  key={size}
                  onClick={() => updateSetting('textSize', size)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${settings.textSize === size ? 'bg-alma-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                >
                  {size === 'normal' ? 'רגיל' : size === 'large' ? 'גדול' : 'גדול מאוד'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => updateSetting('highContrast', !settings.highContrast)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.highContrast ? 'bg-alma-primary/5 border-alma-primary text-alma-primary font-bold' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}
          >
            <span className="flex items-center gap-3"><Contrast size={18} /> ניגודיות גבוהה</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.highContrast ? 'bg-alma-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.highContrast ? 'right-6' : 'right-1'}`} />
            </div>
          </button>

          <button 
            onClick={() => updateSetting('grayscale', !settings.grayscale)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.grayscale ? 'bg-alma-primary/5 border-alma-primary text-alma-primary font-bold' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}
          >
            <span className="flex items-center gap-3"><EyeOff size={18} /> גווני אפור</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.grayscale ? 'bg-alma-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.grayscale ? 'right-6' : 'right-1'}`} />
            </div>
          </button>

          <button 
            onClick={() => updateSetting('readableFont', !settings.readableFont)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.readableFont ? 'bg-alma-primary/5 border-alma-primary text-alma-primary font-bold' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}
          >
            <span className="flex items-center gap-3"><ALargeSmall size={18} /> פונט קריא</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.readableFont ? 'bg-alma-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.readableFont ? 'right-6' : 'right-1'}`} />
            </div>
          </button>

          <button 
            onClick={() => updateSetting('highlightLinks', !settings.highlightLinks)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${settings.highlightLinks ? 'bg-alma-primary/5 border-alma-primary text-alma-primary font-bold' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'}`}
          >
            <span className="flex items-center gap-3"><MousePointer2 size={18} /> הדגשת קישורים</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.highlightLinks ? 'bg-alma-primary' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.highlightLinks ? 'right-6' : 'right-1'}`} />
            </div>
          </button>

          <button 
            onClick={resetSettings}
            className="w-full flex items-center justify-center gap-2 p-4 text-gray-400 hover:text-red-500 transition-colors text-sm font-bold"
          >
            <RefreshCw size={16} /> ביטול כל ההתאמות
          </button>
        </div>
        
        <div className="bg-gray-50 p-4 text-center">
          <button 
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent('nav-legal', { detail: 'accessibility-statement' }));
            }}
            className="text-xs font-bold text-alma-primary underline"
          >
            הצהרת נגישות מלאה
          </button>
        </div>
      </div>

      {/* Main Toggle Button - Draggable */}
      <button 
        onMouseDown={(e) => onStart(e.clientX, e.clientY)}
        onTouchStart={(e) => onStart(e.touches[0].clientX, e.touches[0].clientY)}
        onClick={toggleMenu}
        className={`bg-alma-primary text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-alma-primary/40 pointer-events-auto ${isDragging ? 'cursor-grabbing scale-110 shadow-alma-primary/40' : 'cursor-grab hover:scale-110'}`}
        aria-label="פתח תפריט נגישות"
        title="גרור להזזה, לחץ לפתיחה"
        style={{ touchAction: 'none' }}
      >
        <Accessibility size={32} />
      </button>
    </div>
  );
};

export default AccessibilityWidget;
