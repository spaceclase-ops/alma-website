
import React from 'react';
import { ArrowRight, Quote, Star, MessageSquare, Heart, ShieldCheck, Trophy } from 'lucide-react';
import { TestimonialItem } from '../types';
import Button from './Button';

interface TestimonialsPageProps {
  onBack: () => void;
  onContactClick: () => void;
}

const allTestimonials: TestimonialItem[] = [
  {
    id: '5',
    name: 'רשת גרייט שייפ',
    role: 'ירון סלע | מנכ"ל ובעלים',
    content: 'It is with great pleasure that I am writing the following paragraphs on behalf of Niv and his work with Great-Shape Health and Fitness clubs. I have been working with Niv for the past 7 years in different capacities. 7 years ago, Niv was the Sales VP for the second largest Country Club in Israel. Within a matter of only a few months, Niv adopted the innovative methods and protocols of our chain, and the sales grew by 25-30%. Working closely with Niv, and seeing his prior knowledge and curiosity regarding Marketing, we decided that Niv and his team would become the Marketing Agency for the Country Club. After 6 months, in which we measured KPIs, the results showed a significant growth both in the number of leads and their quality, that were generated from Social media, at the same budget. We have transferred the account of the whole chain to Niv\'s Marketing Agency. This act has proven to be one of the most lucrative decisions we have made.',
    image: 'https://picsum.photos/100/100?random=25'
  },
  {
    id: '6',
    name: 'B-Cure Laser',
    role: 'אלי שוטן | סמנכ"ל',
    content: 'מהרגע שהתחלנו לעבוד עם "עלמה?", הרגשתי שהשיווק של העסק נמצא בידיים הכי טובות שיש. השילוב בין ייעוץ אסטרטגי חכם לבין הבנה עמוקה של השוק נתן לנו את הביטחון לצמוח. מומלץ בחום לכל בעל עסק שמחפש קפיצת מדרגה.',
    image: 'https://picsum.photos/100/100?random=26'
  },
  {
    id: '4',
    name: 'בודי סטאר כפר סבא',
    role: 'הילה | בעלים',
    content: 'העבודה עם "עלמה?" היתה מקצועית. תמיד יודעים לתת את התשובות הנכונות ותמיד במיידי . תמיד קשובים לצרכי הלקוח. הלקוח אצלם תמיד במקום הראשון. שזה הכי חשוב בעצם, שיש על מי לסמוך ושיהיה מי שיקשיב ואז ינווטו את העסק שלי להצלחה. ממליצה בחום .',
    image: 'https://picsum.photos/100/100?random=24'
  },
  {
    id: '1',
    name: 'קאנטרי נשר',
    role: 'עוזי | מנכ"ל',
    content: 'אנחנו עובדים עם עלמה? בליווי מלא. לא רק פרסום, אלא חשיבה עמוקה על העסק: תסריטי שיחה, תהליכי מכירה והחיבור בין שיווק לשטח. יש תחושה ברורה שיש יד על ההגה.',
    image: 'https://picsum.photos/100/100?random=21'
  },
  {
    id: '2',
    name: 'קאנטרי רמות ירושלים',
    role: 'יצחק | מנכ"ל',
    content: 'לא חיפשנו עוד משרד פרסום, אלא מישהו שיעשה סדר. עלמה? נכנסים לאסטרטגיה ולשיחות המכירה, והכול נהיה ברור יותר. פחות רעש, יותר החלטות נכונות.',
    image: 'https://picsum.photos/100/100?random=22'
  },
  {
    id: '3',
    name: 'גוסטינו',
    role: 'אמנון | בעלים',
    content: 'הליווי של עלמה? הוא מקצה לקצה. מהאסטרטגיה, דרך הפרסום ועד מועדון הלקוחות והתפעול היומיומי. זה מרגיש כמו חלק מהניהול של העסק, לא ספק חיצוני.',
    image: 'https://picsum.photos/100/100?random=23'
  },
  {
    id: '7',
    name: 'קליניקת המגע',
    role: 'רונית | מייסדת',
    content: 'הגענו לעלמה אחרי כמה משרדי פרסום שהבטיחו הרים וגבעות. כאן מצאנו אמת. השיווק לא רק מביא לידים, הוא מביא את האנשים הנכונים שמתאימים לערכים שלנו.',
    image: 'https://picsum.photos/100/100?random=27'
  },
  {
    id: '8',
    name: 'פיטנס פלוס',
    role: 'אלון | מנהל שיווק',
    content: 'היתרון הגדול של עלמה הוא היכולת לחבר בין הנתונים לבין היצירתיות. כל החלטה מגובה במספרים, וכל מודעה היא יצירה בפני עצמה.',
    image: 'https://picsum.photos/100/100?random=28'
  }
];

const TestimonialsPage: React.FC<TestimonialsPageProps> = ({ onBack, onContactClick }) => {
  return (
    <div className="pt-32 pb-24 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-alma-primary font-medium mb-12 hover:underline transition-all group"
        >
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          חזרה לדף הבית
        </button>

        <div className="mb-20 text-center">
          <h1 className="text-5xl lg:text-7xl font-black text-alma-dark mb-6 leading-tight">
            מה הלקוחות שלנו <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-alma-primary to-alma-accent">אומרים תכלס</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            אנחנו לא מאמינים במילים גדולות, אלא בתוצאות שמדברות בעד עצמן. הנה כמה מהשותפים שלנו לדרך והסיפורים שלהם.
          </p>
        </div>

        {/* Trust Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
           {[
             { icon: Heart, label: "לקוחות מרוצים", value: "100+" },
             { icon: Trophy, label: "סיפורי הצלחה", value: "178+" },
             { icon: ShieldCheck, label: "שנות ניסיון", value: "18+" },
             { icon: MessageSquare, label: "ליווי אישי", value: "1:1" }
           ].map((stat, idx) => (
             <div key={idx} className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-alma-primary/10 text-alma-primary flex items-center justify-center mb-4">
                   <stat.icon size={24} />
                </div>
                <p className="text-3xl font-black text-alma-dark">{stat.value}</p>
                <p className="text-sm text-gray-400 font-bold">{stat.label}</p>
             </div>
           ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {allTestimonials.map((item) => (
            <div 
              key={item.id} 
              className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-start text-right relative hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="absolute top-8 left-8 text-alma-primary/10 group-hover:text-alma-primary/30 transition-colors">
                <Quote size={60} />
              </div>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-alma-light shadow-md">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                   <h4 className="text-xl font-bold text-alma-dark">{item.name}</h4>
                   <p className="text-sm text-alma-primary font-bold">{item.role}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-6">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                 ))}
              </div>

              <p className="text-gray-600 italic text-lg leading-relaxed relative z-10">
                "{item.content}"
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-alma-dark text-white rounded-[60px] p-12 lg:p-24 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"></div>
           <div className="relative z-10">
              <h2 className="text-3xl lg:text-5xl font-black mb-8">רוצים להיות סיפור ההצלחה הבא?</h2>
              <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                הצטרפו למאות עסקים שכבר עברו מעבודה עם "ספקים" לבניית מנגנון שיווק ומכירות יציב ואמיתי.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Button onClick={onContactClick} className="text-xl px-12 py-5 shadow-2xl">
                    בואו נדבר תכלס <ArrowRight size={24} className="mr-2" />
                 </Button>
                 <a href="tel:0557294068">
                    <Button variant="outline" className="text-xl px-12 py-5 border-white text-white hover:bg-white hover:text-alma-dark">
                       התקשרו אלינו
                    </Button>
                 </a>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default TestimonialsPage;
