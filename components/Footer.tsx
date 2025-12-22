import React from 'react';
import { Heart } from 'lucide-react';

interface FooterProps {
  onFAQClick?: () => void;
  onInsightsClick?: () => void;
  onTestimonialsClick?: () => void;
  onServicesClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onFAQClick, onInsightsClick, onTestimonialsClick, onServicesClick }) => {
  const navigateLegal = (slug: string) => {
    window.dispatchEvent(new CustomEvent('nav-legal', { detail: slug }));
    window.scrollTo(0, 0);
  };

  const openCookieSettings = () => {
    window.dispatchEvent(new CustomEvent('reopen-cookie-settings'));
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <a href="#" className="text-3xl font-extrabold tracking-tight text-alma-dark mb-6">
            עלמה?<span className="text-alma-accent text-teal-400"></span>
          </a>
          
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-sm font-medium text-gray-600">
            <button onClick={() => navigateLegal('privacy-policy')} className="hover:text-alma-primary transition-colors">מדיניות פרטיות</button>
            <button onClick={() => navigateLegal('terms-of-use')} className="hover:text-alma-primary transition-colors">תנאי שימוש</button>
            <button onClick={() => navigateLegal('cookie-policy')} className="hover:text-alma-primary transition-colors">מדיניות עוגיות</button>
            <button onClick={() => navigateLegal('accessibility-statement')} className="hover:text-alma-primary transition-colors">הצהרת נגישות</button>
            <button onClick={onFAQClick} className="hover:text-alma-primary transition-colors">שאלות נפוצות</button>
            <button onClick={onInsightsClick} className="hover:text-alma-primary transition-colors">מגזין תובנות</button>
            <button onClick={onTestimonialsClick} className="hover:text-alma-primary transition-colors">המלצות</button>
            <button onClick={onServicesClick} className="hover:text-alma-primary transition-colors font-bold">שירותים</button>
            <button onClick={openCookieSettings} className="hover:text-alma-primary transition-colors">ניהול עוגיות</button>
          </nav>

          <p className="text-gray-400 text-xs mb-6">
            © {new Date().getFullYear()} כל הזכויות שמורות לעלמה, סוכנות שיווק דיגיטלי. המידע באתר אינו מהווה ייעוץ מקצועי מחייב.
          </p>

          <div className="flex items-center text-gray-400 text-sm">
            נבנה עם <Heart size={16} className="mx-1 text-red-500 fill-red-500" /> ע"י צוות עלמה?
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;