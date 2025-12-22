
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 bg-alma-light/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="lg:w-1/2 order-2 lg:order-1">
             <div className="relative">
                <div className="absolute inset-0 bg-alma-primary rounded-3xl transform rotate-3 opacity-20"></div>
                <img 
                  src="/images/about-niv.jpg" 
                  alt="ניב עיני, מייסד עלמה שיווק דיגיטלי, עומד בחיוך ומקרין סמכות מקצועית" 
                  className="relative rounded-3xl shadow-2xl w-full object-cover h-[500px] lg:h-[600px]"
                />
                {/* Stats */}
                <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur rounded-xl p-6 shadow-xl max-w-xs">
                  <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                    <span className="text-4xl font-bold text-alma-primary">8+</span>
                    <span className="text-sm font-medium text-gray-600">שנות ניסיון<br/>בבניית מנגנונים שעובדים</span>
                  </div>
                   <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-alma-accent text-teal-500">100+</span>
                    <span className="text-sm font-medium text-gray-600">לקוחות מרוצים<br/>שעברו מספקים לשיטה</span>
                  </div>
                </div>
             </div>
          </div>

          <div className="lg:w-1/2 order-1 lg:order-2">
            <h2 className="text-alma-primary font-semibold text-lg mb-3 uppercase tracking-widest">נעים להכיר</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-alma-dark mb-6">אנחנו "עלמה?" <br/>השותפים שלכם לדרך</h3>
            
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              בעולם שבו השיווק הדיגיטלי משתנה כל רגע, עסקים רצים משיטה לשיטה ומקמפיין לקמפיין.
כל פעם מבטיחים להם “הפעם זה יעבוד”, ובפועל – התלות רק גדלה. הבעיה כמעט אף פעם לא הפרסום עצמו. היא במה שקורה לפניו ואחריו.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              ב״עלמה?״ אנחנו לא מתחילים ישר ממודעות. אנחנו נכנסים לעסק, מפרקים את התמונה, ומסדרים את היסודות: זהות, מסר, תהליך מכירה ומנגנון עבודה. רק כשיש על מה להישען – אנחנו מפעילים שיווק.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'יחס אישי וזמינות מלאה',
                'קריאייטיב שנשען על הבנה עסקית',
                'שקיפות מלאה בנתונים ובהחלטות',
                'התמחות בכל הפלטפורמות',
                'פתרונות שמותאמים לקצב ולמצב של העסק',
                'ליווי יד ביד להצלחה'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="text-alma-accent text-teal-500 flex-shrink-0" size={20} />
                  <span className="text-gray-800 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
