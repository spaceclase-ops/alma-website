import React from 'react';
import { Clock, ArrowLeft } from 'lucide-react';
import { insights } from '../data/insightsData';
import Button from './Button';

interface InsightsProps {
  onSelect?: (slug: string) => void;
  onSeeAllClick?: () => void;
}

const Insights: React.FC<InsightsProps> = ({ onSelect, onSeeAllClick }) => {
  // הצגת 4 כתבות ראשונות בדף הבית
  const homeInsights = insights.slice(0, 4);

  return (
    <section id="insights" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-alma-primary font-semibold text-lg mb-3 uppercase tracking-widest">ערך מוסף</h2>
          <h3 className="text-4xl font-bold text-alma-dark mb-4">תובנות מהשטח</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            ריכזנו עבורכם כמה מהשיעורים הכי חשובים שלמדנו מליווי של מאות עסקים. בלי פילטרים, רק מה שעובד באמת.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {homeInsights.map((insight) => (
            <div 
              key={insight.slug} 
              onClick={() => onSelect?.(insight.slug)}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-alma-primary/20 transition-all duration-300 flex flex-col sm:flex-row gap-6 items-start cursor-pointer group"
            >
              {insight.image ? (
                <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
                  <img src={insight.image} alt={insight.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-2xl ${insight.bgColor} ${insight.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <insight.icon size={28} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-alma-primary uppercase tracking-wider">{insight.category}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Clock size={12} />
                    <span>{insight.readMinutes} דקות קריאה</span>
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-alma-dark mb-3 group-hover:text-alma-primary transition-colors">{insight.title}</h4>
                <p className="text-gray-600 leading-relaxed text-lg mb-4 line-clamp-2">
                  {insight.content}
                </p>
                <span className="text-alma-primary font-medium text-sm flex items-center gap-2 group-hover:translate-x-[-4px] transition-transform">
                  קראו את המאמר המלא &larr;
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
           <Button onClick={onSeeAllClick} variant="outline" className="px-10 py-4 font-bold">
              לכל התובנות והמאמרים <ArrowLeft size={18} className="mr-2" />
           </Button>
        </div>
      </div>
    </section>
  );
};

export default Insights;