import React from 'react';
import { Heart } from 'lucide-react';
import { isPlainLeftClick } from '../navigation';

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

  // Real link for crawlers and new tabs; a plain click keeps the in-app navigation.
  const linkTo = (href: string, action?: () => void) => ({
    href,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!action || !isPlainLeftClick(e)) return;
      e.preventDefault();
      action();
    },
  });

  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <a href="#" className="text-3xl font-extrabold tracking-tight text-alma-dark mb-6">
            עלמה?<span className="text-alma-accent text-teal-400"></span>
          </a>
          
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-sm font-medium text-gray-600">
            <a {...linkTo('/legal/privacy-policy', () => navigateLegal('privacy-policy'))} className="hover:text-alma-primary transition-colors">מדיניות פרטיות</a>
            <a {...linkTo('/legal/terms-of-use', () => navigateLegal('terms-of-use'))} className="hover:text-alma-primary transition-colors">תנאי שימוש</a>
            <a {...linkTo('/legal/cookie-policy', () => navigateLegal('cookie-policy'))} className="hover:text-alma-primary transition-colors">מדיניות עוגיות</a>
            <a {...linkTo('/legal/accessibility-statement', () => navigateLegal('accessibility-statement'))} className="hover:text-alma-primary transition-colors">הצהרת נגישות</a>
            <a {...linkTo('/faq', onFAQClick)} className="hover:text-alma-primary transition-colors">שאלות נפוצות</a>
            <a {...linkTo('/insights', onInsightsClick)} className="hover:text-alma-primary transition-colors">מגזין תובנות</a>
            <a {...linkTo('/testimonials', onTestimonialsClick)} className="hover:text-alma-primary transition-colors">המלצות</a>
            <a {...linkTo('/services', onServicesClick)} className="hover:text-alma-primary transition-colors font-bold">שירותים</a>
            <button onClick={openCookieSettings} className="hover:text-alma-primary transition-colors">ניהול עוגיות</button>
          </nav>

          {/* suppressHydrationWarning: the year is baked in at build time and may be stale until the next deploy */}
          <p className="text-gray-400 text-xs mb-6" suppressHydrationWarning>
            © {new Date().getFullYear()} כל הזכויות שמורות ל"עלמה?" – צמיחה ופיתוח עסקי. המידע באתר אינו מהווה ייעוץ מקצועי מחייב.
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