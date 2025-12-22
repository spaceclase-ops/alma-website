
import React from 'react';
/* Added missing Search icon to the imports from lucide-react */
import { ArrowRight, CheckCircle2, XCircle, Info, Workflow, Target, BarChart, Settings, FastForward, Search } from 'lucide-react';
import Button from './Button';

interface AboutPageProps {
  onBack: () => void;
  onContactClick: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onBack, onContactClick }) => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-64 -mt-64 w-[800px] h-[800px] bg-alma-primary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-alma-primary font-medium mb-12 hover:underline transition-all group"
        >
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          חזרה לדף הבית
        </button>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-16 items-center mb-32">
          <div className="lg:w-3/5">
            <h1 className="text-5xl lg:text-7xl font-black text-alma-dark mb-8 leading-tight">
              פרסום הוא כלי, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-alma-primary to-alma-accent">לא הפתרון עצמו</span>
            </h1>
            <div className="space-y-6 text-xl text-gray-600 leading-relaxed">
              <p>
                <strong>"עלמה?"</strong> הוא משרד ליווי אסטרטגי ושיווקי הפועל משנת 2018. אנחנו מלווים עסקים שמבינים שהצלחה בדיגיטל לא נמדדת רק בקליקים, אלא במה שקורה כשהטלפון מצלצל.
              </p>
              <p>
                מאז הקמת עלמה ליווינו מעל <strong>178 עסקים</strong>, בעיקר בתחומי השירות, הקמעונאות, הפיטנס ועסקים מבוססי מכירה. העבודה שלנו מתמקדת בבניית מנגנון עסקי ושיווקי שמחבר בין זהות העסק, תהליכי מכירה, תפעול ופרסום – בצורה שמחזיקה לאורך זמן.
              </p>
            </div>
          </div>
          <div className="lg:w-2/5">
             <div className="relative">
                <div className="absolute inset-0 bg-alma-accent rounded-[60px] transform rotate-3 opacity-20"></div>
                <img 
                  src="/images/about-alma.png" 
                  alt="ניב עיני - עלמה" 
                  className="relative rounded-[60px] shadow-2xl w-full h-[500px] object-cover"
                />
                <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-3xl shadow-xl">
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">מייסד המשרד</p>
                   <p className="text-2xl font-black text-alma-dark">ניב עיני</p>
                   <p className="text-alma-primary font-medium">מומחה מכירות ושיווק משנת 2006</p>
                </div>
             </div>
          </div>
        </div>

        {/* Background & Philosophy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32">
           <div className="bg-gray-50 p-12 lg:p-16 rounded-[60px]">
              <h2 className="text-3xl font-bold text-alma-dark mb-8">הניסיון שלי, השקט שלכם</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                הרקע שלי הוא בעולמות המכירות והשיווק משנת 2006. ניהלתי מערכי מכירה בארגונים גדולים, בניתי צוותים, פיתחתי תסריטי שיחה וליוויתי עסקים מקרוב בשטח.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                הניסיון הזה לימד אותי דבר אחד ברור: <strong>ברוב העסקים הבעיה אינה מחסור בלידים</strong>, אלא חוסר חיבור בין השיווק למה שקורה אחרי שהטלפון מצלצל. אנחנו כאן כדי ליצור את החיבור הזה.
              </p>
           </div>
           <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-alma-dark mb-8">הצוות שמאחורי הקלעים</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                "עלמה?" פועלת עם צוות ליווי מקיף הכולל אנשי שיווק, קריאייטיב, ניתוח נתונים ותהליכים. אנחנו לא מאמינים בתבניות קבועות – כל עסק מקבל התאמה אישית לפי המבנה שלו והמציאות האמיתית שבה הוא פועל.
              </p>
              <div className="flex items-center gap-4 p-6 bg-alma-light rounded-2xl border-r-4 border-alma-primary italic">
                <p className="text-alma-dark font-medium">
                  "אנחנו לא מחליפים את העסק ולא עושים במקומכם. אנחנו עושים סדר כדי שתוכלו להפעיל את המנגנון גם לבד."
                </p>
              </div>
           </div>
        </div>

        {/* Not for Everyone Section */}
        <div className="bg-alma-dark text-white rounded-[80px] p-12 lg:p-24 mb-32 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
           
           <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-6xl font-black mb-6">"עלמה?" לא מתאימה לכל אחד</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">אנחנו מאוד סלקטיביים בלקוחות שאנחנו בוחרים ללוות. הנה למה:</p>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white/5 p-10 rounded-[40px] border border-white/10">
                 <h3 className="text-2xl font-bold text-red-400 mb-8 flex items-center gap-3">
                   <XCircle size={32} /> למי זה לא מתאים?
                 </h3>
                 <ul className="space-y-4">
                    {[
                      'למי שמחפש "רק לידים" בלי לגעת בתהליכי המכירה',
                      'למי שמחפש פתרון קסם מהיר בלי לשנות דבר בהתנהלות',
                      'למי שרוצה להשאיר את העסק בטייס אוטומטי מלא',
                      'למי שמחפש תירוצים על שוק, עונה או "לידים לא איכותיים"',
                      'לעסקים שלא מוכנים להסתכל לנתונים בעיניים'
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                 </ul>
              </div>

              <div className="bg-white/5 p-10 rounded-[40px] border border-white/10">
                 <h3 className="text-2xl font-bold text-alma-accent mb-8 flex items-center gap-3">
                   <CheckCircle2 size={32} /> למי זה כן מתאים?
                 </h3>
                 <ul className="space-y-4">
                    {[
                      'לעסקים שמבינים ששיווק טוב חושף בעיות ולא רק מחפה עליהן',
                      'למי שמוכן לעבוד בצורה מסודרת ולבנות מנגנון יציב',
                      'למי שמבין שהתוצאות מגיעות לאט יותר בהתחלה אך מחזיקות זמן רב',
                      'לעסקים שמוכנים לבצע התאמות פנימיות גם כשזה לא נוח',
                      'למי שרוצה שליטה אמיתית ופחות רעש'
                    ].map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-alma-accent mt-2.5 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                 </ul>
              </div>
           </div>
        </div>

        {/* Step-by-Step Process */}
        <div className="mb-32">
           <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-black text-alma-dark mb-6">איך נראה תהליך העבודה?</h2>
              <p className="text-xl text-gray-600">לא מתחילים בפרסום. מתחילים בלראות אמת.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "1",
                  title: "אבחון",
                  desc: "אנחנו נכנסים לעסק ומפרקים את התמונה: איפה הכסף נוזל ואיפה נופלים הלקוחות.",
                  icon: Search,
                  color: "bg-blue-500"
                },
                {
                  step: "2",
                  title: "חידוד אסטרטגי",
                  desc: "דיוק המסר והקהל. בניית תסריטי שיחה והגדרה ברורה של מה כן ומה לא עושים.",
                  icon: Target,
                  color: "bg-purple-500"
                },
                {
                  step: "3",
                  title: "בניית מנגנון",
                  desc: "חיבור כל החלקים: פרסום, שיחה ומעקב. מערכת אחת שעובדת יחד בסנכרון.",
                  icon: Settings,
                  color: "bg-teal-500"
                },
                {
                  step: "4",
                  title: "תנועה ושיפור",
                  desc: "יוצאים לפרסום, מודדים תוצאות ומבצעים התאמות שכל הזמן משפרות את המערכת.",
                  icon: BarChart,
                  color: "bg-orange-500"
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[40px] shadow-lg border border-gray-100 hover:border-alma-primary/20 transition-all group">
                   <div className={`w-16 h-16 rounded-2xl ${item.color} text-white flex items-center justify-center mb-6 shadow-lg transform group-hover:-rotate-6 transition-transform`}>
                      <item.icon size={32} />
                   </div>
                   <h4 className="text-xl font-bold text-alma-dark mb-4">{item.step}. {item.title}</h4>
                   <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-32">
           <h2 className="text-3xl font-bold text-alma-dark mb-12 text-center">שאלות שעולות כמעט תמיד</h2>
           <div className="space-y-6">
              {[
                {
                  q: "אתם משרד פרסום?",
                  a: "לא במובן הקלאסי. פרסום הוא כלי אצלנו, לא המוצר. אנחנו עובדים על מה שקורה לפני ואחרי המודעה."
                },
                {
                  q: "תוך כמה זמן רואים תוצאות?",
                  a: "מי שמחפש קסם, יתאכזב. מי שמוכן לעבוד נכון, רואה שינוי בהתנהלות מהר מאוד, ותוצאות שמחזיקות לאורך זמן."
                },
                {
                  q: "אתם מתחייבים לתוצאות?",
                  a: "אנחנו מתחייבים לתהליך מדויק, שקוף ואמיתי. תוצאות מגיעות כשגם העסק זז, לא רק אנחנו."
                },
                {
                  q: "זה מתאים לעסק קטן או רק לגדולים?",
                  a: "זה לא עניין של גודל, אלא של גישה. יש עסקים קטנים שעובדים חכם, וגדולים שמבולגנים. הגודל לא קובע."
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                   <h5 className="text-xl font-bold text-alma-dark mb-4 flex items-center gap-3">
                      <Workflow size={20} className="text-alma-primary" /> {item.q}
                   </h5>
                   <p className="text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-br from-alma-light to-blue-100 p-16 rounded-[80px] border border-white shadow-xl">
           <h2 className="text-3xl lg:text-5xl font-black text-alma-dark mb-8">מוכנים לבנות מנגנון יציב?</h2>
           <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              בלי מנגנון שעובד ביום יום, אין שיווק שמחזיק לאורך זמן. בואו נבדוק אם אנחנו מתאימים בשיחת אבחון אחת.
           </p>
           <Button onClick={onContactClick} className="text-xl px-12 py-5 shadow-2xl">
              בואו נדבר תכלס <ArrowRight size={24} className="mr-2" />
           </Button>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
