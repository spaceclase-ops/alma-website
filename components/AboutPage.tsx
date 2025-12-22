
import React from 'react';
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
                  src="./about-niv.jpg" 
                  alt="ניב עיני - אדריכל שיווק דיגיטלי" 
                  className="relative rounded-[60px] shadow-2xl w-full h-[500px] object-cover border-8 border-white"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-3xl shadow-xl">
                   <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">מייסד המשרד</p>
                   <p className="text-2xl font-black text-alma-dark">ניב עיני</p>
                   <p className="text-alma-primary font-medium">מומחה מכירות ושיווק משנת 2006</p>
                </div>
             </div>
          </div>
        </div>

        {/* Philosophy & Not for Everyone... sections remain same */}
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
        
        {/* Rest of the component remains the same... */}
      </div>
    </div>
  );
};

export default AboutPage;
