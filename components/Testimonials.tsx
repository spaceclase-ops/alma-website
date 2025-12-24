
import React from 'react';
import { Quote, ArrowLeft } from 'lucide-react';
import { TestimonialItem } from '../types';
import Button from './Button';

const testimonials: TestimonialItem[] = [
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
    name: 'Body Star',
    role: 'הילה | בעלים',
    content: 'העבודה עם "עלמה?" היתה מקצועית. תמיד יודעים לתת את התשובות הנכונות ותמיד במיידי . תמיד קשובים לצרכי הלקוח. הלקוח אצלם תמיד במקום הראשון. שזה הכי חשוב בעצם, שיש על מי לסמוך ושיהיה מי שיקשיב ואז ינווטו את העסק שלי להצלחה. ממליצה בחום .',
    image: 'https://picsum.photos/100/100?random=24'
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
              
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-alma-light mb-4 shadow-md">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="mb-4">
                <h4 className="text-xl font-bold text-alma-dark">{item.name}</h4>
                <p className="text-sm text-alma-primary font-medium">{item.role}</p>
              </div>
              
              <p className="text-gray-600 italic leading-relaxed">"{item.content}"</p>
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
