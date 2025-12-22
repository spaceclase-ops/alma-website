import React from 'react';
import { Layout, Share2, TrendingUp, PenTool, Smartphone, Target, ArrowLeft } from 'lucide-react';
import { ServiceItem } from '../types';
import Button from './Button';

const services: ServiceItem[] = [
  {
    id: '1',
    title: 'זהות וחדות עסקית',
    description: 'כשהעסק לא יודע מי הוא ולמי הוא מוכר, כל מסר נשמע כמו כולם. אנחנו מחדדים זהות, ערך והצעה ברורה שמאפשרת ללקוחות להבין למה לבחור דווקא בך',
    icon: Share2
  },
  {
    id: '2',
    title: 'מנגנון שיווק לפני הקמפיין',
    description: 'קמפיינים בלי מערכת סביבם לא מחזיקים. אנחנו בונים מנגנון שמחבר בין מסר, קהל, מדידה וקבלת החלטות – ורק אז את המודעות הממומנות',
    icon: TrendingUp
  },
  {
    id: '3',
    title: 'תהליך מכירה מסודר',
    description: 'רוב הכסף הולך לאיבוד אחרי הליד. אנחנו בונים תהליך מכירה ברור: מענה, תסריט, מעקב והנעה לפעולה',
    icon: Layout
  },
  {
    id: '4',
    title: 'אסטרטגיה ולא ניחושים',
    description: 'בלי כיוון ברור, כל פעולה מרגישה דחופה אבל לא מקדמת. אנחנו מגדירים מטרות, סדרי עדיפויות ותכנית עבודה רבעונית',
    icon: PenTool
  },
  {
    id: '5',
    title: 'תוכן שמניע לקבלת ההחלטה',
    description: 'תוכן טוב לא נמדד בלייקים אלא בהשפעה על הבחירה של הלקוח. אנחנו בונים תוכן שמשרת את תהליך השיווק והמכירה, לא את האלגוריתם בלבד',
    icon: Smartphone
  },
  {
    id: '6',
    title: 'נראות שמחזיקה ערך אמיתי',
    description: 'עיצוב בלי אסטרטגיה הוא קישוט יפה לבעל הבית. אנחנו מוודאים שהנראות מחזקת את המסר, את המחיר ואת האמון – לא רק יפה בעין',
    icon: Target
  }
];

interface ServicesProps {
  onSeeAllClick?: () => void;
}

const Services: React.FC<ServicesProps> = ({ onSeeAllClick }) => {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-alma-primary font-semibold text-lg mb-3 uppercase tracking-widest">מה אנחנו עושים</h2>
          <h3 className="text-4xl font-bold text-alma-dark mb-4">הפתרונות שלנו לצמיחה שלך</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            מעטפת דיגיטלית מלאה המותאמת אישית לצרכים של העסק שלך. אנחנו כאן כדי לדאוג לכל הזרועות הדיגיטליות שלך.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="group p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-alma-primary/30 hover:shadow-xl hover:shadow-alma-primary/10 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-alma-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center text-alma-primary mb-6 group-hover:bg-alma-primary group-hover:text-white transition-colors duration-300">
                  <service.icon size={28} />
                </div>
                <h4 className="text-2xl font-bold text-alma-dark mb-3 group-hover:text-alma-primary transition-colors">{service.title}</h4>
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
           <Button onClick={onSeeAllClick} variant="outline" className="px-10 py-4 font-bold">
              לפירוט המסלולים המלא <ArrowLeft size={18} className="mr-2" />
           </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;