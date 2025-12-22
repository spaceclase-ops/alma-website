import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, HelpCircle, MessageSquare, Zap, Target, Users, TrendingUp, Shield, Workflow, HelpCircle as FaqIcon } from 'lucide-react';
import Button from './Button';

interface FAQPageProps {
  onBack: () => void;
  onContactClick: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: any;
}

const FAQPage: React.FC<FAQPageProps> = ({ onBack, onContactClick }) => {
  const [openId, setOpenId] = useState<string | null>('1');

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: "מה אתם בעצם עושים?",
      answer: "אנחנו לא “עוד משרד פרסום”. אנחנו נכנסים לעסק ובונים מנגנון שמחבר בין שיווק, מכירות והתנהלות יומיומית. פרסום הוא רק חלק קטן מהתמונה, לפעמים אפילו לא השלב הראשון.",
      icon: Workflow
    },
    {
      id: '2',
      question: "אז אתם כן עושים פרסום או לא?",
      answer: "כן. אבל לא כפעולה מנותקת. אנחנו עושים פרסום רק אחרי שיש: מסר ברור, תהליך מכירה תקין, ויכולת אמיתית לטפל בלידים שמגיעים. בלי זה, פרסום הוא בזבוז כסף עם אנרגיה טובה.",
      icon: Zap
    },
    {
      id: '3',
      question: "למה לא להתחיל ישר מקמפיין?",
      answer: "כי קמפיין לא מתקן בעיות פנימיות. אם השיחה לא בנויה, אם אין מעקב, אם אין חיבור בין ההבטחה למציאות, הקמפיין רק יגדיל את הבעיה. אנחנו מעדיפים לעצור רגע, להבין, ואז לזוז חכם.",
      icon: Target
    },
    {
      id: '4',
      question: "עם מי אתם עובדים?",
      answer: "עם בעלי עסקים שרוצים שליטה, לא קסמים. עסקים שמבינים שהם חלק מהתהליך, ולא מחפשים שמישהו “יעשה להם שיווק ויעלם”. זה לא מתאים למי שמחפש פתרון מהיר בלי מעורבות.",
      icon: Users
    },
    {
      id: '5',
      question: "באילו תחומים יש לכם ניסיון?",
      answer: "עבדנו עם מאות עסקים לאורך השנים: חדרי כושר, קאנטרי, סטודיואים, קליניקות, מסעדות, חנויות, עמותות, נותני שירות ועסקים מבוססי לידים. היתרון שלנו הוא לא בענף עצמו, אלא בהבנה של אנשים, שיחות ומנגנונים.",
      icon: Shield
    },
    {
      id: '6',
      question: "כמה זמן לוקח לראות תוצאות?",
      answer: "שינוי בהתנהלות מורגש די מהר. תוצאות עסקיות יציבות לוקחות זמן, כי בונים משהו שמחזיקה. מי שמחפש זינוק רגעי, כנראה לא יתחבר. מי שמחפש שקט, יציבות והבנה, כן.",
      icon: TrendingUp
    },
    {
      id: '7',
      question: "אתם מתחייבים לתוצאות?",
      answer: "אנחנו מתחייבים לתהליך ברור, שקוף ומקצועי. תוצאות מגיעות כשגם העסק זז, לא רק אנחנו. אין התחייבות למספרים מהאוויר, יש אחריות אמיתית על הדרך.",
      icon: Shield
    },
    {
      id: '8',
      question: "זה אומר שאני צריך להיות מעורב?",
      answer: "כן. לא ברמה יומיומית, אבל כן בהחלטות, בהבנה וביישום. מי שמחפש להוריד אחריות לגמרי, יתאכזב. מי שמוכן לקחת את ההגה ביחד איתנו, מרוויח.",
      icon: Users
    },
    {
      id: '9',
      question: "מה ההבדל ביניכם לבין יועץ עסקי?",
      answer: "יועץ נותן המלצות. אנחנו מלווים יישום. אנחנו לא רק אומרים מה צריך לעשות, אלא בונים יחד תהליכים, תסריטים, מסרים ומנגנונים שעובדים בשטח.",
      icon: HelpCircle
    },
    {
      id: '10',
      question: "כמה זה עולה?",
      answer: "אין מחיר קבוע, כי אין שני עסקים זהים. העלות תלויה בהיקף הליווי, במורכבות ובמה שצריך לבנות בפועל. אנחנו לא הכי זולים, ולא מנסים להיות. אנחנו כן חוסכים כסף לאורך זמן למי שעובד נכון.",
      icon: MessageSquare
    },
    {
      id: '11',
      question: "זה מתאים גם אם כבר עבדתי עם כמה משרדי פרסום?",
      answer: "בדיוק לשם זה מתאים. ברוב המקרים הבעיה לא הייתה במשרד, אלא בהיעדר מנגנון פנימי ושותפות אמיתית. אנחנו לא מחליפים משרד, אנחנו מסדרים את המערכת.",
      icon: Workflow
    },
    {
      id: '12',
      question: "מה קורה אם זה לא מתאים?",
      answer: "עוצרים. בלי משחקים, בלי מריחות, בלי התחייבויות מיותרות. המטרה שלנו היא התאמה, לא סגירה בכל מחיר.",
      icon: Target
    }
  ];

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-alma-primary font-medium mb-12 hover:underline transition-all group"
        >
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          חזרה לדף הבית
        </button>

        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[30px] bg-alma-primary/10 text-alma-primary mb-6">
            <FaqIcon size={40} />
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-alma-dark mb-6 leading-tight">
            שאלות שעולות <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-alma-primary to-alma-accent">כמעט תמיד</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            ריכזנו עבורכם את כל התשובות הכי חשובות כדי שתוכלו להבין אם אנחנו הפרטנרים הנכונים לעסק שלכם.
          </p>
        </div>

        <div className="space-y-4 mb-20">
          {faqs.map((faq) => (
            <div 
              key={faq.id} 
              className={`border rounded-[32px] overflow-hidden transition-all duration-300 ${
                openId === faq.id 
                  ? 'border-alma-primary/30 shadow-xl shadow-alma-primary/5 bg-gray-50' 
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <button 
                onClick={() => toggle(faq.id)}
                className="w-full px-8 py-6 flex items-center justify-between text-right outline-none group"
              >
                <div className="flex items-center gap-5">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                     openId === faq.id ? 'bg-alma-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                   }`}>
                      <faq.icon size={20} />
                   </div>
                   <span className={`text-xl font-bold transition-colors ${
                     openId === faq.id ? 'text-alma-primary' : 'text-alma-dark'
                   }`}>
                     {faq.question}
                   </span>
                </div>
                {openId === faq.id ? <ChevronUp size={24} className="text-alma-primary" /> : <ChevronDown size={24} className="text-gray-300" />}
              </button>
              
              <div 
                className={`px-8 transition-all duration-300 ease-in-out ${
                  openId === faq.id ? 'max-h-[500px] pb-8 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pr-14 text-lg text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-alma-dark text-white rounded-[60px] p-12 lg:p-16 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
           <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-black mb-6">לא מצאתם את התשובה שחיפשתם?</h2>
              <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                הדרך הכי טובה לקבל תשובות מדויקות היא פשוט לדבר. לא שיחת מכירה, אלא שיחת בדיקה אמיתית.
              </p>
              <Button onClick={onContactClick} className="text-xl px-12 py-5 shadow-2xl">
                 בואו נבדוק התאמה בשיחה <ArrowRight size={24} className="mr-2" />
              </Button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default FAQPage;