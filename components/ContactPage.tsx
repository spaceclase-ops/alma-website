
import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, MessageCircle, Clock, Navigation } from 'lucide-react';
import Button from './Button';

interface ContactPageProps {
  onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
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
    hp_field: '',
    bot_answer: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formState.hp_field) return;
    if (parseInt(formState.bot_answer) !== (botChallenge.a + botChallenge.b)) {
      alert("נא להזין תשובה נכונה לשאלת האבטחה.");
      return;
    }

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    
    if (!accessKey || accessKey === 'your_access_key_here') {
      alert('שגיאה: מפתח Web3Forms לא מוגדר. אנא בדוק את קובץ .env.local');
      console.error('Web3Forms access key is missing');
      return;
    }
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: 'Contact Form – Contact Page',
          from_name: 'Alma Website',
          name: formState.name.trim(),
          phone: formState.phone.trim(),
          email: formState.email.trim(),
          message: formState.message.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Meta Pixel Lead Tracking
        if ((window as any).fbq) {
          (window as any).fbq('track', 'Lead', {
            content_name: 'Full Contact Page Form',
            status: 'Success'
          });
        }

        console.log('Form submitted successfully');
        alert('תודה רבה! ההודעה נשלחה בהצלחה.');
        setFormState({ name: '', phone: '', email: '', message: '', marketingConsent: false, hp_field: '', bot_answer: '' });
      } else {
        console.error('Form submission failed:', data);
        alert('משהו השתבש בשליחת ההודעה. נסו שוב מאוחר יותר.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      alert('שגיאה בשליחת ההודעה. נסו שוב מאוחר יותר.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormState({
      ...formState,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleWhatsAppClick = () => {
    if ((window as any).fbq) {
      (window as any).fbq('track', 'Contact', {
        content_name: 'WhatsApp Click Contact Page',
        method: 'WhatsApp'
      });
    }
  };

  const whatsappUrl = "https://wa.me/972557294068?text=היי%20ניב,%20אני%20רוצה%20להתייעץ%20לגבי%20העסק%20שלי";
  const wazeUrl = "https://www.waze.com/ul?ll=32.6565,35.1095&navigate=yes";

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-alma-primary font-medium mb-12 hover:underline transition-all group"
        >
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          חזרה לדף הבית
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          <div>
            <h1 className="text-5xl lg:text-7xl font-black text-alma-dark mb-8 leading-tight">
              בואו נדבר <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-alma-primary to-alma-accent">תכלס על העסק</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              השאירו פרטים בטופס או פנו אלינו באחד מהערוצים הישירים. 
              אנחנו מבטיחים לחזור אליכם עם אבחון ראשוני ולא רק עם הצעת מחיר.
            </p>

            <div className="space-y-8 mb-16">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-alma-primary/10 flex items-center justify-center text-alma-primary">
                  <Phone size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">טלפון ישיר</h4>
                  <a href="tel:0557294068" className="text-2xl font-bold text-alma-dark hover:text-alma-primary transition-colors">055-7294068</a>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <MessageCircle size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">WhatsApp</h4>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={handleWhatsAppClick} className="text-2xl font-bold text-alma-dark hover:text-green-600 transition-colors underline decoration-green-200">לחצו למעבר לשיחה</a>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-alma-accent/10 flex items-center justify-center text-alma-accent">
                  <MapPin size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">כתובת המשרד</h4>
                  <p className="text-2xl font-bold text-alma-dark mb-2">הגיא 25, יקנעם עילית</p>
                  <a href={wazeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-alma-primary font-bold hover:underline">
                    <Navigation size={18} /> נווטו אלינו ב-Waze
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600">
                  <Clock size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">שעות פעילות</h4>
                  <p className="text-xl font-bold text-alma-dark">א' - ה': 09:00 - 18:00</p>
                  <p className="text-gray-500">ו' וערבי חג: סגור</p>
                </div>
              </div>
            </div>

            <div className="bg-alma-light p-8 rounded-[40px] border border-alma-primary/10">
              <h5 className="text-xl font-bold text-alma-dark mb-4">מה קורה אחרי שמשאירים פרטים?</h5>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-alma-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <p className="text-gray-600">שיחת היכרות קצרה (עד 10 דקות) להבין את הצרכים שלכם.</p>
                </li>
                <li className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-alma-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <p className="text-gray-600">אבחון ראשוני של המנגנון הקיים אצלכם בעסק.</p>
                </li>
                <li className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-alma-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <p className="text-gray-600">הצגת תוכנית עבודה תכל'סית שמתאימה לכם.</p>
                </li>
              </ol>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-[60px] p-10 lg:p-14 shadow-2xl border border-gray-100 relative z-10">
              <h3 className="text-3xl font-bold text-alma-dark mb-8">השאירו פרטים כאן</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input type="text" name="hp_field" className="hp-field" value={formState.hp_field} onChange={handleChange} />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">שם מלא</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formState.name}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-alma-primary focus:bg-white outline-none transition-all"
                      placeholder="ישראל ישראלי"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">טלפון</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formState.phone}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-alma-primary focus:bg-white outline-none transition-all"
                      placeholder="05X-XXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">אימייל</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formState.email}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-alma-primary focus:bg-white outline-none transition-all"
                    placeholder="example@mail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">איך נוכל לעזור?</label>
                  <textarea
                    name="message"
                    rows={4}
                    value={formState.message}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-alma-primary focus:bg-white outline-none transition-all resize-none"
                    placeholder="ספרו לנו קצת על העסק שלכם..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">כמה זה {botChallenge.a} + {botChallenge.b}?</label>
                  <input
                    type="number"
                    name="bot_answer"
                    required
                    value={formState.bot_answer}
                    onChange={handleChange}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-alma-primary focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input
                      type="checkbox"
                      name="marketingConsent"
                      checked={formState.marketingConsent}
                      onChange={handleChange}
                      className="mt-1.5 w-5 h-5 text-alma-primary rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600 leading-snug">
                      אני מאשר קבלת פניות שיווקיות ומסכים ל
                      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('nav-legal', { detail: 'terms-of-use' }))} className="text-alma-primary underline mx-1">תנאי השימוש</button>
                      ו
                      <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('nav-legal', { detail: 'privacy-policy' }))} className="text-alma-primary underline mx-1">מדיניות הפרטיות</button>
                    </span>
                  </label>
                </div>

                <Button type="submit" className="w-full py-5 text-xl font-black shadow-2xl">
                  שילחו לי הודעה
                </Button>
              </form>
            </div>

            {/* Google Maps Placeholder/Iframe */}
            <div className="mt-12 rounded-[40px] overflow-hidden shadow-xl border-4 border-white h-80 bg-gray-100 relative">
               <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4233.0682494463645!2d35.081678312082566!3d32.638457915673946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151da94656fe969b%3A0x4f9adc05745b96cc!2z16LXnNee15Q_!5e0!3m2!1siw!2sil!4v1766585829038!5m2!1siw!2sil" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="משרדי עלמה יקנעם"
              ></iframe>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
