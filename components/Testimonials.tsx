
import React from 'react';
import { Quote, ArrowLeft } from 'lucide-react';
import { TestimonialItem } from '../types';
import Button from './Button';

const testimonials: TestimonialItem[] = [
  {
    id: '1',
    name: 'קאנטרי גרייט שייפ נשר',
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
  }
];

interface TestimonialsProps {
  onSeeAllClick?: () => void;
}

const Testimonials: React.FC<TestimonialsProps> = ({ onSeeAllClick }) => {
  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-alma-primary font-semibold text-lg mb-3 uppercase tracking-widest">לקוחות מספרים</h2>
          <h3 className="text-4xl font-bold text-alma-dark">המילים החמות שלכם</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center text-center relative hover:-translate-y-2 transition-transform duration-300">
              <div className="absolute top-6 left-6 text-alma-primary/20">
                <Quote size={40} />
              </div>
              
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-alma-light mb-6 shadow-md">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <p className="text-gray-600 italic mb-6 leading-relaxed">"{item.content}"</p>
              
              <div className="mt-auto">
                <h4 className="text-xl font-bold text-alma-dark">{item.name}</h4>
                <p className="text-sm text-alma-primary font-medium">{item.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
           <Button onClick={onSeeAllClick} variant="outline" className="px-10 py-4 font-bold">
              לצפייה בכל ההמלצות <ArrowLeft size={18} className="mr-2" />
           </Button>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
