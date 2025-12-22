import React, { useState } from 'react';
import { ArrowRight, Clock, Calendar, User, Search, Filter } from 'lucide-react';
import { insights } from '../data/insightsData';
import Button from './Button';

interface InsightsPageProps {
  onBack: () => void;
  onSelectInsight: (slug: string) => void;
}

const InsightsPage: React.FC<InsightsPageProps> = ({ onBack, onSelectInsight }) => {
  const [filter, setFilter] = useState('הכל');

  const categories = ['הכל', ...Array.from(new Set(insights.map(i => i.category)))];
  
  const filteredInsights = filter === 'הכל' 
    ? insights 
    : insights.filter(i => i.category === filter);

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
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
            מגזין <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-alma-primary to-alma-accent">תובנות מהשטח</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            השיעורים שלמדנו מליווי של מאות עסקים. בלי פילטרים, רק מה שעובד באמת בעולם השיווק, המכירות והאסטרטגיה.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
          <div className="flex items-center gap-2 ml-4 text-gray-400">
            <Filter size={18} />
            <span className="font-bold text-sm">סינון:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                filter === cat 
                  ? 'bg-alma-primary text-white shadow-lg shadow-alma-primary/30' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredInsights.map((insight) => (
            <div 
              key={insight.slug}
              onClick={() => onSelectInsight(insight.slug)}
              className="bg-white rounded-[40px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col h-full"
            >
              <div className={`aspect-[16/10] ${insight.bgColor} flex items-center justify-center relative overflow-hidden`}>
                 <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                 <insight.icon size={80} className={`${insight.color} transform group-hover:scale-125 transition-transform duration-700`} />
                 <div className="absolute top-6 right-6">
                    <span className="bg-white/90 backdrop-blur-sm text-alma-dark px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                      {insight.category}
                    </span>
                 </div>
              </div>
              
              <div className="p-10 flex flex-col flex-grow">
                 <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                    <div className="flex items-center gap-1.5">
                       <Calendar size={14} />
                       <span>{insight.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                       <Clock size={14} />
                       <span>{insight.readMinutes} דק' קריאה</span>
                    </div>
                 </div>

                 <h3 className="text-2xl font-black text-alma-dark mb-4 group-hover:text-alma-primary transition-colors leading-tight">
                    {insight.title}
                 </h3>
                 
                 <p className="text-gray-500 leading-relaxed mb-8 line-clamp-3 text-lg">
                    {insight.content}
                 </p>

                 <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-alma-primary/10 flex items-center justify-center text-alma-primary">
                          <User size={14} />
                       </div>
                       <span className="text-sm font-bold text-gray-700">{insight.author}</span>
                    </div>
                    <span className="text-alma-primary font-black text-sm group-hover:translate-x-[-4px] transition-transform">
                       קראו עוד &larr;
                    </span>
                 </div>
              </div>
            </div>
          ))}
        </div>

        {filteredInsights.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-[40px]">
             <Search size={48} className="mx-auto text-gray-300 mb-4" />
             <p className="text-xl text-gray-500 font-medium">לא נמצאו מאמרים בקטגוריה זו</p>
             <button onClick={() => setFilter('הכל')} className="text-alma-primary font-bold mt-4 underline">הציגו את כל המאמרים</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default InsightsPage;