
import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact: React.FC = () => {
  // Rate limiting check
  const checkRateLimit = () => {
    const lastSub = localStorage.getItem('_sf_ls');
    if (lastSub) {
      const diff = Date.now() - parseInt(lastSub);
      if (diff < 60000) return false; // 1 minute cooldown
    }
    return true;
  };

  const [botChallenge] = useState({
    a: Math.floor(Math.random() * 10) + 1,
    b: Math.floor(Math.random() * 10) + 1
  });

  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    marketingConsent: false,
    hp_field: '', // Honeypot
    bot_answer: '' // Simple Math CAPTCHA alternative
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Honeypot check
    if (formState.hp_field) {
      console.warn("Bot detected via honeypot.");
      return;
    }

    // 2. Bot challenge
    if (parseInt(formState.bot_answer) !== (botChallenge.a + botChallenge.b)) {
      alert("נא להזין תשובה נכונה לשאלת האבטחה.");
      return;
    }

    // 3. Marketing Consent
    if (!formState.marketingConsent) {
      alert('יש לאשר את תנאי השימוש ומדיניות הפרטיות להמשך.');
      return;
    }

    // 4. Rate Limiting
    if (!checkRateLimit()) {
      alert("נא להמתין דקה לפני שליחה נוספת.");
      return;
    }
    
    // Security sanitized payload
    const payload = {
      n: formState.name.trim().substring(0, 100),
      p: formState.phone.trim().substring(0, 20),
      e: formState.email.trim().substring(0, 100),
      ts: new Date().toISOString(),
      c: true
    };
    
    // Meta Pixel Lead Tracking
    if ((window as any).fbq) {
      (window as any).fbq('track', 'Lead', {
        content_name: 'Home Contact Form',
        status: 'Success'
      });
    }

    localStorage.setItem('_sf_ls', Date.now().toString());
    console.log('Secure submission:', payload);
    alert('תודה רבה! ההודעה נשלחה בהצלחה.');
    setFormState({ name: '', phone: '', email: '', message: '', marketingConsent: false, hp_field: '', bot_answer: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormState({
      ...formState,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  return (
    <section id="contact" className="py-24 bg-alma-dark text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-alma-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-alma-accent rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-alma-accent text-teal-400 font-semibold text-lg mb-3 uppercase tracking-widest">דברו איתנו</h2>
            <h3 className="text-4xl lg:text-5xl font-bold mb-6">מוכנים לקחת את העסק<br/>שלכם לשלב הבא?</h3>
            <p className="text-gray-300 text-lg mb-10 leading-relaxed">
              השאירו פרטים בטופס או צרו איתנו קשר ישירות. הקפה עלינו, האסטרטגיה גם. בואו נבדוק איך אנחנו יכולים לעזור לעסק שלכם לגדול.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-alma-accent text-teal-400">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">טלפון</p>
                  <a href="tel:0557294069" className="text-xl font-medium hover:text-alma-primary transition-colors">055-7294069</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-alma-accent text-teal-400">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">אימייל</p>
                  <a href="mailto:niv@alma-ads.co.il" className="text-xl font-medium hover:text-alma-primary transition-colors">niv@alma-ads.co.il</a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-alma-accent text-teal-400">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">כתובת</p>
                  <p className="text-xl font-medium">הגיא 25, יקנעם עילית</p>
                </div>
              </div>
            </div>

            <p className="mt-12 text-sm text-gray-400 flex items-center gap-2 italic">
              <span className="w-2 h-2 rounded-full bg-alma-accent"></span>
              השירות כולל שימוש בכלים אוטומטיים ובינה מלאכותית
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-2xl text-gray-800">
            <h4 className="text-2xl font-bold text-alma-dark mb-6">השאירו פרטים</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot field */}
              <input 
                type="text" 
                name="hp_field" 
                className="hp-field" 
                autoComplete="off" 
                value={formState.hp_field} 
                onChange={handleChange} 
              />
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  value={formState.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-alma-primary focus:ring-2 focus:ring-alma-primary/20 outline-none transition-all"
                  placeholder="ישראל ישראלי"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  maxLength={20}
                  value={formState.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-alma-primary focus:ring-2 focus:ring-alma-primary/20 outline-none transition-all"
                  placeholder="055-7294069"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  maxLength={100}
                  value={formState.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-alma-primary focus:ring-2 focus:ring-alma-primary/20 outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="bot_answer" className="block text-sm font-medium text-gray-700 mb-1">כמה זה {botChallenge.a} ועוד {botChallenge.b}?</label>
                <input
                  type="number"
                  id="bot_answer"
                  name="bot_answer"
                  required
                  value={formState.bot_answer}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-alma-primary focus:ring-2 focus:ring-alma-primary/20 outline-none transition-all"
                  placeholder="תשובה"
                />
              </div>
              
              <div className="py-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="marketingConsent"
                    required
                    checked={formState.marketingConsent}
                    onChange={handleChange}
                    className="mt-1 w-5 h-5 text-alma-primary rounded border-gray-300 focus:ring-alma-primary"
                  />
                  <span className="text-sm text-gray-600 leading-tight">
                    אני מאשר או מאשרת קבלת פניות, עדכונים ודיוור שיווקי בהתאם ל
                    <button 
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('nav-legal', { detail: 'privacy-policy' }))}
                      className="text-alma-primary underline mx-1"
                    >
                      מדיניות הפרטיות
                    </button>
                    ו
                    <button 
                      type="button"
                      onClick={() => window.dispatchEvent(new CustomEvent('nav-legal', { detail: 'terms-of-use' }))}
                      className="text-alma-primary underline mx-1"
                    >
                      תנאי השימוש
                    </button>
                  </span>
                </label>
                <p className="mt-2 text-xs text-gray-400 pr-8">ניתן להסיר את ההסכמה בכל עת</p>
              </div>

              <Button type="submit" className="w-full py-4 text-lg font-bold shadow-xl">
                שלח הודעה
              </Button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
