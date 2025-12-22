
import React, { useState, useEffect } from 'react';
import { Menu, X, Facebook } from 'lucide-react';
import Button from './Button';
import { NavItem } from '../types';

const navItems: NavItem[] = [
  { label: 'ראשי', href: '#home' },
  { label: 'שירותים', href: '#services' },
  { label: 'קצת עליי', href: '#about' },
  { label: 'המלצות', href: '#testimonials' },
  { label: 'תובנות', href: '#insights' },
  { label: 'שאלות נפוצות', href: '#faq' },
  { label: 'צור קשר', href: '#contact' },
];

interface HeaderProps {
  onHomeClick?: () => void;
  onContactClick?: () => void;
  onAboutClick?: () => void;
  onFAQClick?: () => void;
  onInsightsClick?: () => void;
  onTestimonialsClick?: () => void;
  onServicesClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onHomeClick, 
  onContactClick, 
  onAboutClick, 
  onFAQClick, 
  onInsightsClick, 
  onTestimonialsClick,
  onServicesClick 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -20% 0px',
      threshold: 0.2,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    const sections = navItems
      .filter(item => item.href.startsWith('#') && !['#faq', '#about', '#contact', '#insights', '#testimonials', '#services', '#home'].includes(item.href))
      .map((item) => document.getElementById(item.href.substring(1)));
      
    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  const handleLinkClick = (href: string) => {
    setIsMenuOpen(false);
    if (href === '#contact' && onContactClick) {
      onContactClick();
      return;
    }
    if (href === '#about' && onAboutClick) {
      onAboutClick();
      return;
    }
    if (href === '#faq' && onFAQClick) {
      onFAQClick();
      return;
    }
    if (href === '#insights' && onInsightsClick) {
      onInsightsClick();
      return;
    }
    if (href === '#testimonials' && onTestimonialsClick) {
      onTestimonialsClick();
      return;
    }
    if (href === '#services' && onServicesClick) {
      onServicesClick();
      return;
    }
    if (href === '#home' && onHomeClick) {
      onHomeClick();
      return;
    }
  };

  const handleWhatsAppClick = () => {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'Contact', {
        content_name: 'Header WhatsApp Button',
        method: 'WhatsApp'
      });
    }
  };

  const whatsappUrl = "https://wa.me/972557294069?text=היי%20ניב,%20ראיתי%20את%20האתר%20ואני%20רוצה%20שיחת%20אבחון%20קצרה";
  const facebookUrl = "https://www.facebook.com/profile.php?id=100064074121688&sk=about";

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          <div className="flex items-center">
            <button 
              onClick={() => handleLinkClick('#home')}
              className="text-3xl font-extrabold tracking-tight text-alma-dark flex items-center outline-none"
            >
              עלמה<span className="text-alma-accent">?</span>
            </button>
          </div>

          <nav className="hidden md:flex items-center space-x-8 space-x-reverse">
            {navItems.map((item) => {
              const isSpecial = ['#contact', '#about', '#faq', '#insights', '#testimonials', '#services', '#home'].includes(item.href);
              const isActive = activeSection === item.href.substring(1);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    if (isSpecial) {
                      e.preventDefault();
                      handleLinkClick(item.href);
                    }
                  }}
                  className={`text-base font-medium transition-all duration-300 relative py-1 ${
                    isActive 
                      ? 'text-alma-primary' 
                      : (isScrolled ? 'text-gray-700 hover:text-alma-primary' : 'text-gray-800 hover:text-alma-primary')
                  }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-alma-primary transition-transform duration-300 transform origin-right ${isActive ? 'scale-x-100' : 'scale-x-0'}`}></span>
                </a>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center space-x-4 space-x-reverse">
             <div className="flex space-x-3 space-x-reverse pl-4 border-l border-gray-300">
                <a 
                  href={facebookUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-gray-500 hover:text-alma-primary transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </a>
             </div>
             <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={handleWhatsAppClick}>
                <Button variant="primary" className="py-2 px-6 text-sm">
                  דברו איתי בוואטסאפ
                </Button>
             </a>
          </div>

          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-alma-primary focus:outline-none"
              aria-label={isMenuOpen ? "סגור תפריט" : "פתח תפריט"}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg py-4 px-4 flex flex-col space-y-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.href);
              }}
              className={`block text-lg font-medium py-2 ${
                activeSection === item.href.substring(1) ? 'text-alma-primary' : 'text-gray-800 hover:text-alma-primary'
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 border-t border-gray-100 flex justify-center space-x-6 space-x-reverse">
             <a 
               href={facebookUrl} 
               target="_blank" 
               rel="noreferrer" 
               className="text-gray-500 hover:text-alma-primary"
               aria-label="Facebook"
             >
               <Facebook size={24} />
             </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
