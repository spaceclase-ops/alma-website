
import React from 'react';
import Button from './Button';
import { ArrowLeft, ArrowDown } from 'lucide-react';

interface HeroProps {
  onContactClick?: () => void;
  onServicesClick?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onContactClick, onServicesClick }) => {
  return (
    <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-br from-alma-light via-white to-blue-50">
      
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-alma-primary/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-alma-accent/20 blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          <div className="lg:w-1/2 text-center lg:text-right">
            <h2 className="text-alma-primary font-semibold text-lg mb-4 tracking-wider uppercase">
              אבחון ובניית מנגנוני שיווק ומכירות
            </h2>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-alma-dark leading-tight mb-6">
             פרסום בלי מנגנון הוא בזבוז כסף<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-alma-primary to-alma-accent">
               עסקים לא נתקעים בגלל חוסר לידים
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
רוב העסקים חושבים שחסר להם פרסום. בפועל חסר להם סדר פנימי: זהות ברורה, תהליך מכירה, ומנגנון שמחזיק גם בלי קמפיין. ב"עלמה?" אנחנו בונים את המנוע של העסק – ורק אז לוחצים על הגז ומפרסמים את הקמפיינים            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button onClick={onContactClick} className="w-full sm:w-auto shadow-xl">
                בואו לשיחת אבחון חכמה <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
              <Button onClick={onServicesClick} variant="outline" className="w-full sm:w-auto">
                לפירוט השירותים שלנו <ArrowDown className="mr-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="lg:w-1/2 relative">
             <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white aspect-[9/16] lg:aspect-square">
                <iframe 
                  className="w-full h-full object-cover"
                  src="https://www.youtube.com/embed/0BW40ybeIDQ?autoplay=1&mute=1&loop=1&playlist=0BW40ybeIDQ&controls=0&modestbranding=1"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8 pointer-events-none">
                  <p className="text-white text-lg font-medium">ככה ייצרנו חצי מיליון שקל ביום אחד</p>
                </div>
             </div>
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow">
                <div className="bg-alma-accent/20 p-3 rounded-full text-alma-accent-dark">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">צמיחה עסקית</p>
                  <p className="text-lg font-bold text-alma-dark">מוכחת</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;