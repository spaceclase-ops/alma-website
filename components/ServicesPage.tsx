import React from 'react';
import { ArrowRight, Share2, TrendingUp, Layout, PenTool, Smartphone, Target, ShieldCheck, Zap, Rocket, CheckCircle2, Star } from 'lucide-react';
import Button from './Button';

interface ServicesPageProps {
  onBack: () => void;
  onContactClick: () => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ onBack, onContactClick }) => {
  const detailedServices = [
    {
      icon: Share2,
      title: "זהות וחדות עסקית",
      desc: "הבסיס לכל שיווק מצליח. אנחנו עוזרים לך להגדיר מי העסק באמת, מה ה-DNA שלו ולמה שמישהו ירצה לקנות דווקא ממנו. בלי זהות ברורה, כל שקל בפרסום הוא הימור.",
      points: ["אפיון קהלי יעד מדויקים", "בניית הצעת ערך בלתי ניתנת לסירוב", "חידוד המסר השיווקי (Positioning)"]
    },
    {
      icon: TrendingUp,
      title: "מנגנון שיווק לפני הקמפיין",
      desc: "אנחנו בונים את המנוע שמתרגם תשומת לב להכנסה. זה כולל הגדרת יעדים, בחירת פלטפורמות נכונות ובניית תוכנית עבודה שנתית ורבעונית.",
      points: ["ניהול תקציב חכם", "מדידה ואופטימיזציה שוטפת", "בניית מסעות לקוח (Customer Journey)"]
    },
    {
      icon: Layout,
      title: "תהליך מכירה מסודר",
      desc: "שיווק מביא את הלקוח לדלת, מכירות מכניסות אותו פנימה. אנחנו בונים יחד איתך את התהליך שקורה מהרגע שהגיע ליד ועד לסגירת העסקה.",
      points: ["בניית תסריטי שיחה אפקטיביים", "הטמעת מערכות CRM ומעקב", "שיפור יחסי המרה במכירות"]
    },
    {
      icon: PenTool,
      title: "אסטרטגיה ולא ניחושים",
      desc: "הפסקת עבודה בשיטת 'כיבוי שריפות'. אנחנו יוצרים שקט ניהולי על ידי תכנון מראש, הגדרת KPI's (מדדי הצלחה) וביצוע מבוסס נתונים.",
      points: ["ניתוח שוק ומתחרים", "תכנון מהלכים שיווקיים רחבים", "ליווי בקבלת החלטות עסקיות"]
    },
    {
      icon: Smartphone,
      title: "תוכן שמניע לקבלת החלטה",
      desc: "תוכן הוא לא רק 'פוסטים יפים'. אנחנו בונים תוכן אסטרטגי שנועד לחנך את השוק, לבנות אמון ולהכין את הלקוח לקנייה.",
      points: ["אסטרטגיית תוכן לסושיאל", "בניית סמכות מקצועית (Authority)", "קריאייטיב מניע לפעולה"]
    },
    {
      icon: Target,
      title: "נראות שמחזיקה ערך אמיתי",
      desc: "הנראות של העסק שלך צריכה לשדר את המחיר ואת האיכות שלו. אנחנו מוודאים שהעיצוב והשפה הגרפית תומכים באסטרטגיה ומושכים את האנשים הנכונים.",
      points: ["שפה גרפית אחידה ויוקרתית", "עיצוב דפי נחיתה ומודעות", "חיבור בין הנראות למסר"]
    }
  ];

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-alma-primary font-medium mb-12 hover:underline transition-all group"
        >
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          חזרה לדף הבית
        </button>

        {/* Header Section */}
        <div className="text-center mb-24">
          <h1 className="text-5xl lg:text-7xl font-black text-alma-dark mb-6 leading-tight">
            הפתרונות שלנו <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-alma-primary to-alma-accent">לצמיחה של העסק שלך</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            אנחנו לא נותנים 'שירותי פרסום' – אנחנו בונים מנגנונים. הליווי שלנו הוא הוליסטי ומתמקד בכל מה שצריך כדי שהעסק יזוז קדימה באמת.
          </p>
        </div>

        {/* Detailed Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
          {detailedServices.map((service, idx) => (
            <div key={idx} className="bg-gray-50 p-10 lg:p-14 rounded-[50px] border border-gray-100 hover:shadow-2xl hover:bg-white transition-all duration-500 group">
              <div className="w-20 h-20 rounded-3xl bg-white shadow-lg flex items-center justify-center text-alma-primary mb-8 group-hover:bg-alma-primary group-hover:text-white transition-all duration-300">
                <service.icon size={36} />
              </div>
              <h3 className="text-3xl font-black text-alma-dark mb-6 group-hover:text-alma-primary transition-colors">{service.title}</h3>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {service.desc}
              </p>
              <ul className="space-y-4">
                {service.points.map((point, pIdx) => (
                  <li key={pIdx} className="flex items-center gap-3 text-gray-800 font-medium">
                    <CheckCircle2 size={20} className="text-alma-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The Method Section */}
        <div className="bg-alma-dark text-white rounded-[80px] p-12 lg:p-24 mb-32 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
           
           <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                 <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight">השיטה: <br/>מנוע יציב לפני הדלק</h2>
                 <p className="text-xl text-gray-400 mb-10 leading-relaxed">
                   רוב העסקים רצים לשים כסף בפרסום (הדלק) לפני שהם בודקים אם המנוע של העסק תקין. התהליך שלנו מוודא שהעסק שלך מוכן לקבל לקוחות, למכור להם ולשמר אותם - עוד לפני שהמודעה הראשונה עולה.
                 </p>
                 <div className="space-y-6">
                    {[
                      { icon: Zap, text: "אבחון וזיהוי 'חורים' במנגנון" },
                      { icon: ShieldCheck, text: "בניית תשתית שיווקית ומכירתית חזקה" },
                      { icon: Rocket, text: "יציאה לפרסום מבוסס אסטרטגיה ונתונים" }
                    ].map((item, iIdx) => (
                      <div key={iIdx} className="flex items-center gap-4 text-xl font-bold">
                        <div className="w-10 h-10 rounded-full bg-alma-primary/20 flex items-center justify-center text-alma-primary">
                          <item.icon size={20} />
                        </div>
                        {item.text}
                      </div>
                    ))}
                 </div>
              </div>
              <div className="lg:w-1/2 relative">
                 <div className="aspect-square bg-white/5 rounded-[60px] border border-white/10 p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-6 mb-12">
                       <div className="w-16 h-16 rounded-3xl bg-alma-accent/20 text-alma-accent flex items-center justify-center">
                          <Star size={32} />
                       </div>
                       <div>
                          <p className="text-2xl font-black">הליווי הוא אישי</p>
                          <p className="text-gray-400">אנחנו שותפים לדרך, לא ספקים חיצוניים.</p>
                       </div>
                    </div>
                    <p className="text-2xl text-gray-300 italic font-medium leading-relaxed border-r-4 border-alma-primary pr-6">
                      "אנחנו לא מנהלים לך את הפרסום. אנחנו מנהלים איתך את הצמיחה של העסק."
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-alma-light p-16 lg:p-24 rounded-[80px] border border-white shadow-xl">
           <h2 className="text-4xl lg:text-5xl font-black text-alma-dark mb-8">לאיזה שירות העסק שלך זקוק עכשיו?</h2>
           <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              כל עסק נמצא בשלב אחר. בואו נבין יחד איפה נקודת המפנה שלכם בשיחת אבחון אחת ללא התחייבות.
           </p>
           <Button onClick={onContactClick} className="text-xl px-12 py-5 shadow-2xl">
              בואו נבדוק התאמה בשיחה <ArrowRight size={24} className="mr-2" />
           </Button>
        </div>

      </div>
    </div>
  );
};

export default ServicesPage;