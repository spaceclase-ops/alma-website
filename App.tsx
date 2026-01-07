
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import LogoStrip from './components/LogoStrip';
import Services from './components/Services';
import ServicesPage from './components/ServicesPage';
import About from './components/About';
import AboutPage from './components/AboutPage';
import Testimonials from './components/Testimonials';
import TestimonialsPage from './components/TestimonialsPage';
import VideoCarousel from './components/VideoCarousel';
import Insights from './components/Insights';
import InsightsPage from './components/InsightsPage';
import Contact from './components/Contact';
import ContactPage from './components/ContactPage';
import FAQPage from './components/FAQPage';
import Footer from './components/Footer';
import ArticleDetail from './components/ArticleDetail';
import CookieConsent from './components/CookieConsent';
import LegalPageLayout from './components/LegalPageLayout';
import AccessibilityWidget from './components/AccessibilityWidget';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams<{ slug: string }>();
  const [legalSlug, setLegalSlug] = useState<string | null>(null);

  // Meta Pixel Tracking for View Changes
  useEffect(() => {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'PageView', {
        content_name: location.pathname,
        content_category: slug || legalSlug || 'main'
      });
    }
  }, [location.pathname, slug, legalSlug]);

  useEffect(() => {
    const handleNavLegal = (e: any) => {
      setLegalSlug(e.detail);
      navigate(`/legal/${e.detail}`);
      window.scrollTo(0, 0);
    };
    window.addEventListener('nav-legal', handleNavLegal);
    return () => window.removeEventListener('nav-legal', handleNavLegal);
  }, [navigate]);

  const handleSelectInsight = (insightSlug: string) => {
    navigate(`/insights/${insightSlug}`);
    window.scrollTo(0, 0);
    if ((window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: insightSlug,
        content_category: 'Insights'
      });
    }
  };

  const handleContactNavigate = () => {
    navigate('/contact');
    setLegalSlug(null);
    window.scrollTo(0, 0);
  };

  const handleAboutNavigate = () => {
    navigate('/about');
    setLegalSlug(null);
    window.scrollTo(0, 0);
  };

  const handleFAQNavigate = () => {
    navigate('/faq');
    setLegalSlug(null);
    window.scrollTo(0, 0);
  };

  const handleInsightsPageNavigate = () => {
    navigate('/insights');
    setLegalSlug(null);
    window.scrollTo(0, 0);
  };

  const handleTestimonialsPageNavigate = () => {
    navigate('/testimonials');
    setLegalSlug(null);
    window.scrollTo(0, 0);
  };

  const handleServicesPageNavigate = () => {
    navigate('/services');
    setLegalSlug(null);
    window.scrollTo(0, 0);
  };

  const handleHomeNavigate = () => {
    navigate('/');
    setLegalSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };

  const renderLegalContent = () => {
    switch (legalSlug) {
      case 'privacy-policy':
        return (
          <LegalPageLayout title="מדיניות פרטיות" onBack={handleHomeNavigate}>
            <section>
              <h2>1. מבוא</h2>
              <p>ברוכים הבאים לאתר של "עלמה, שיווק דיגיטלי". אנו מכבדים את פרטיותך ומחויבים להגן על המידע האישי שאתה משתף איתנו. מדיניות זו מסבירה אילו סוגי מידע אנו אוספים וכיצד אנו משתמשים בו.</p>
            </section>
            <section>
              <h2>2. המידע שאנו אוספים</h2>
              <p>אנו אוספים מידע שאתה מספק לנו ישירות דרך טפסי יצירת קשר, כגון שם, מספר טלפון וכתובת אימייל. בנוסף, אנו עשויים לאסוף מידע טכני אוטומטי כגון כתובת IP, סוג דפדפן ונתוני שימוש באתר לצורך שיפור השירות.</p>
            </section>
            <section>
              <h2>3. שימוש במידע</h2>
              <p>המידע משמש למתן מענה לפניותיך, לשיפור חווית המשתמש באתר, ולשלוח עדכונים שיווקיים במידה ונתת לכך הסכמה מפורשת. אנו לא מוכרים את המידע שלך לצדדים שלישיים.</p>
            </section>
            <section>
              <h2>4. זכויותיך</h2>
              <p>לכל משתמש קיימת הזכות לעיין במידע המוחזק עליו, לבקש את תיקונו או את מחיקתו המלאה ממערכותינו. לצורך כך ניתן לפנות אלינו בכתובת המופיעה בדף יצירת הקשר.</p>
            </section>
          </LegalPageLayout>
        );
      case 'terms-of-use':
        return (
          <LegalPageLayout title="תנאי שימוש" onBack={handleHomeNavigate}>
            <section>
              <h2>1. קבלה של תנאי השימוש</h2>
              <p>השימוש באתר מותנה בהסכמתך המלאה לתנאים המפורטים להלן. אם אינך מסכים לתנאים אלו, הנך מתבקש שלא לעשות שימוש באתר.</p>
            </section>
            <section>
              <h2>2. קניין רוחני</h2>
              <p>כל התכנים המופיעים באתר, לרבות טקסטים, עיצובים, לוגואים ותמונות, שייכים ל"עלמה" או לצדדים שלישיים שהתירו לנו להשתמש בהם. אין להעתיק או להפיץ תכנים אלו ללא אישור מראש ובכתב.</p>
            </section>
            <section>
              <h2>3. הגבלת אחריות</h2>
              <p>המידע באתר ניתן כפי שהוא (AS IS) לצורכי התרשמות ומידע כללי בלבד. "עלמה" לא תישא באחריות לכל נזק, ישיר או עקיף, שינבע מהשימוש באתר או מהסתמכות על המידע המופיע בו.</p>
            </section>
          </LegalPageLayout>
        );
      case 'cookie-policy':
        return (
          <LegalPageLayout title="מדיניות עוגיות" onBack={handleHomeNavigate}>
            <section>
              <h2>מהן עוגיות (Cookies)?</h2>
              <p>עוגיות הן קבצי טקסט קטנים המאוחסנים במחשב או במכשיר הנייד שלך בעת הגלישה באתר. הן עוזרות לאתר לזכור את הפעולות וההעדפורות שלך לאורך זמן.</p>
            </section>
            <section>
              <h2>באילו סוגי עוגיות אנו משתמשים?</h2>
              <ul>
                <li><strong>עוגיות חיוניות:</strong> הכרחיות לתפעול הבסיסי של האתר.</li>
                <li><strong>עוגיות סטטיסטיקה:</strong> עוזרות לנו להבין איך גולשים משתמשים באתר כדי לשפר את הביצועים.</li>
                <li><strong>עוגיות שיווק:</strong> משמשות להתאמת מודעות ותכנים רלוונטיים עבורך.</li>
              </ul>
            </section>
            <section>
              <h2>ניהול עוגיות</h2>
              <p>ניתן לשנות את העדפות העוגיות בכל עת דרך הקישור "ניהול עוגיות" המופיע בתחתית האתר.</p>
            </section>
          </LegalPageLayout>
        );
      case 'accessibility-statement':
        return (
          <LegalPageLayout title="הצהרת נגישות" onBack={handleHomeNavigate}>
            <section>
              <h2>מבוא</h2>
              <p>אנו ב"עלמה" רואים חשיבות עליונה בהנגשת האתר והשירותים שלנו לכלל האוכלוסייה, לרבות אנשים עם מוגבלות. אתר זה הונגש בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ובתקן הישראלי ת"י 5568 ברמה AA.</p>
            </section>
            <section>
              <h2>התאמות שבוצעו באתר</h2>
              <ul>
                <li><strong>ניווט מקלדת:</strong> האתר מותאם לניווט מלא באמצעות המקלדת בלבד (Tab, Enter).</li>
                <li><strong>תמיכה בקוראי מסך:</strong> בוצעו התאמות טכניות לשימוש בתוכנות קורא מסך (NVDA, JAWS).</li>
                <li><strong>ניגודיות ותצוגה:</strong> הוספנו רכיב נגישות המאפשר שינוי ניגודיות צבעים, גווני אפור והגדלת טקסט.</li>
                <li><strong>היררכיה:</strong> המבנה כולל כותרות ברורות (H1-H4) לשמירה על סדר קריאה נכון.</li>
                <li><strong>תמונות:</strong> נוספו תיאורי Alt לכל התמונות המשמעותיות באתר.</li>
              </ul>
            </section>
            <section>
              <h2>רכז נגישות ודרכי פנייה</h2>
              <p>אם נתקלתם בקושי בנגישות באתר או שיש לכם הצעה לשיפור, נשמח לעמוד לרשותכם:</p>
              <ul>
                <li><strong>רכז נגישות:</strong> ניב עיני</li>
                <li><strong>טלפון:</strong> 055-7294069</li>
                <li><strong>דוא"ל:</strong> niv@alma-ads.co.il</li>
              </ul>
              <p>תאריך עדכון הצהרה: פברואר 2024.</p>
            </section>
          </LegalPageLayout>
        );
      default:
        return <div className="pt-32 text-center">הדף לא נמצא</div>;
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Header 
        onHomeClick={handleHomeNavigate} 
        onContactClick={handleContactNavigate} 
        onAboutClick={handleAboutNavigate}
        onFAQClick={handleFAQNavigate}
        onInsightsClick={handleInsightsPageNavigate}
        onTestimonialsClick={handleTestimonialsPageNavigate}
        onServicesClick={handleServicesPageNavigate}
      />
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <Hero onContactClick={handleContactNavigate} onServicesClick={handleServicesPageNavigate} />
              <LogoStrip />
              <Services onSeeAllClick={handleServicesPageNavigate} />
              <About />
              <Testimonials onSeeAllClick={handleTestimonialsPageNavigate} />
              <VideoCarousel />
              <Insights onSelect={handleSelectInsight} onSeeAllClick={handleInsightsPageNavigate} />
              <Contact />
            </>
          } />
          <Route path="/contact" element={<ContactPage onBack={handleHomeNavigate} />} />
          <Route path="/about" element={<AboutPage onBack={handleHomeNavigate} onContactClick={handleContactNavigate} />} />
          <Route path="/faq" element={<FAQPage onBack={handleHomeNavigate} onContactClick={handleContactNavigate} />} />
          <Route path="/insights" element={<InsightsPage onBack={handleHomeNavigate} onSelectInsight={handleSelectInsight} />} />
          <Route path="/insights/:slug" element={<InsightDetailWrapper onSelectOther={handleSelectInsight} />} />
          <Route path="/testimonials" element={<TestimonialsPage onBack={handleHomeNavigate} onContactClick={handleContactNavigate} />} />
          <Route path="/services" element={<ServicesPage onBack={handleHomeNavigate} onContactClick={handleContactNavigate} />} />
          <Route path="/legal/:slug" element={<LegalPageWrapper />} />
        </Routes>
      </main>
      <Footer onFAQClick={handleFAQNavigate} onInsightsClick={handleInsightsPageNavigate} onTestimonialsClick={handleTestimonialsPageNavigate} onServicesClick={handleServicesPageNavigate} />
      <CookieConsent />
      <AccessibilityWidget />
    </div>
  );
}

function InsightDetailWrapper({ onSelectOther }: { onSelectOther: (slug: string) => void }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  if (!slug) return null;
  
  return (
    <ArticleDetail 
      slug={slug} 
      onBack={() => navigate('/insights')} 
      onSelectOther={onSelectOther}
    />
  );
}

function LegalPageWrapper() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const renderLegalContent = () => {
    switch (slug) {
      case 'privacy-policy':
        return (
          <LegalPageLayout title="מדיניות פרטיות" onBack={() => navigate('/')}>
            <section>
              <h2>1. מבוא</h2>
              <p>ברוכים הבאים לאתר של "עלמה, שיווק דיגיטלי". אנו מכבדים את פרטיותך ומחויבים להגן על המידע האישי שאתה משתף איתנו. מדיניות זו מסבירה אילו סוגי מידע אנו אוספים וכיצד אנו משתמשים בו.</p>
            </section>
            <section>
              <h2>2. המידע שאנו אוספים</h2>
              <p>אנו אוספים מידע שאתה מספק לנו ישירות דרך טפסי יצירת קשר, כגון שם, מספר טלפון וכתובת אימייל. בנוסף, אנו עשויים לאסוף מידע טכני אוטומטי כגון כתובת IP, סוג דפדפן ונתוני שימוש באתר לצורך שיפור השירות.</p>
            </section>
            <section>
              <h2>3. שימוש במידע</h2>
              <p>המידע משמש למתן מענה לפניותיך, לשיפור חווית המשתמש באתר, ולשלוח עדכונים שיווקיים במידה ונתת לכך הסכמה מפורשת. אנו לא מוכרים את המידע שלך לצדדים שלישיים.</p>
            </section>
            <section>
              <h2>4. זכויותיך</h2>
              <p>לכל משתמש קיימת הזכות לעיין במידע המוחזק עליו, לבקש את תיקונו או את מחיקתו המלאה ממערכותינו. לצורך כך ניתן לפנות אלינו בכתובת המופיעה בדף יצירת הקשר.</p>
            </section>
          </LegalPageLayout>
        );
      case 'terms-of-use':
        return (
          <LegalPageLayout title="תנאי שימוש" onBack={() => navigate('/')}>
            <section>
              <h2>1. קבלה של תנאי השימוש</h2>
              <p>השימוש באתר מותנהכמתך המלאה לתנאים המפורטים להלן. אם אינך מסכים לתנאים אלו, הנך מתבקש שלא לעשות שימוש באתר.</p>
            </section>
            <section>
              <h2>2. קניין רוחני</h2>
              <p>כל התכנים המופיעים באתר, לרבות טקסטים, עיצובים, לוגואים ותמונות, שייכים ל"עלמה" או לצדדים שלישיים שהתירו לנו להשתמש בהם. אין להעתיק או להפיץ תכנים אלו ללא אישור מראש ובכתב.</p>
            </section>
            <section>
              <h2>3. הגבלת אחריות</h2>
              <p>המידע באתר ניתן כפי שהוא (AS IS) לצורכי התרשמות ומידע כללי בלבד. "עלמה" לא תישא באחריות לכל נזק, ישיר או עקיף, שינבע מהשימוש באתר או מהסתמכות על המידע המופיע בו.</p>
            </section>
          </LegalPageLayout>
        );
      case 'cookie-policy':
        return (
          <LegalPageLayout title="מדיניות עוגיות" onBack={() => navigate('/')}>
            <section>
              <h2>מהן עוגיות (Cookies)?</h2>
              <p>עוגיות הן קבצי טקסט קטנים המאוחסנים במחשב או במכשיר הנייד שלך בעת הגלישה באתר. הן עוזרות לאתר לזכור את הפעולות וההעדפורות שלך לאורך זמן.</p>
            </section>
            <section>
              <h2>באילו סוגי עוגיות אנו משתמשים?</h2>
              <ul>
                <li><strong>עוגיות חיוניות:</strong> הכרחיות לתפעול הבסיסי של האתר.</li>
                <li><strong>עוגיות סטטיסטיקה:</strong> עוזרות לנו להבין איך גולשים משתמשים באתר כדי לשפר את הביצועים.</li>
                <li><strong>עוגיות שיווק:</strong> משמשות להתאמת מודעות ותכנים רלוונטיים עבורך.</li>
              </ul>
            </section>
            <section>
              <h2>ניהול עוגיות</h2>
              <p>ניתן לשנות את העדפות העוגיות בכל עת דרך הקישור "ניהול עוגיות" המופיע בתחתית האתר.</p>
            </section>
          </LegalPageLayout>
        );
      case 'accessibility-statement':
        return (
          <LegalPageLayout title="הצהרת נגישות" onBack={() => navigate('/')}>
            <section>
              <h2>מבוא</h2>
              <p>אנו ב"עלמה" רואים חשיבות עליונה בהנגשת האתר והשירותים שלנו לכלל האוכלוסייה, לרבות אנשים עם מוגבלות. אתר זה הונגש בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013, ובתקן הישראלי ת"י 5568 ברמה AA.</p>
            </section>
            <section>
              <h2>התאמות שבוצעו באתר</h2>
              <ul>
                <li><strong>ניווט מקלדת:</strong> האתר מותאם לניווט מלא באמצעות המקלדת בלבד (Tab, Enter).</li>
                <li><strong>תמיכה בקוראי מסך:</strong> בוצעו התאמות טכניות לשימוש בתוכנות קורא מסך (NVDA, JAWS).</li>
                <li><strong>ניגודיות ותצוגה:</strong> הוספנו רכיב נגישות המאפשר שינוי ניגודיות צבעים, גווני אפור והגדלת טקסט.</li>
                <li><strong>היררכיה:</strong> המבנה כולל כותרות ברורות (H1-H4) לשמירה על סדר קריאה נכון.</li>
                <li><strong>תמונות:</strong> נוספו תיאורי Alt לכל התמונות המשמעותיות באתר.</li>
              </ul>
            </section>
            <section>
              <h2>רכז נגישות ודרכי פנייה</h2>
              <p>אם נתקלתם בקושי בנגישות באתר או שיש לכם הצעה לשיפור, נשמח לעמוד לרשותכם:</p>
              <ul>
                <li><strong>רכז נגישות:</strong> ניב עיני</li>
                <li><strong>טלפון:</strong> 055-7294069</li>
                <li><strong>דוא"ל:</strong> niv@alma-ads.co.il</li>
              </ul>
              <p>תאריך עדכון הצהרה: פברואר 2024.</p>
            </section>
          </LegalPageLayout>
        );
      default:
        return <div className="pt-32 text-center">הדף לא נמצא</div>;
    }
  };
  
  return renderLegalContent();
}

function App() {
  return <AppContent />;
}

export default App;
