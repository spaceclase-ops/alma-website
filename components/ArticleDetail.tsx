import React from 'react';
import { ArrowRight, Calendar, User, Clock, Share2, Facebook, Send } from 'lucide-react';
import { insights } from '../data/insightsData';
import Button from './Button';

interface ArticleDetailProps {
  slug: string;
  onBack: () => void;
  onSelectOther: (slug: string) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ slug, onBack, onSelectOther }) => {
  const article = insights.find(i => i.slug === slug);
  const idx = insights.findIndex(i => i.slug === slug);
  const related = [
    insights[(idx + 1) % insights.length],
    insights[(idx + 2) % insights.length]
  ];

  // Basic Security Sanitization for rendered HTML
  const sanitize = (html: string) => {
    return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
               .replace(/on\w+="[^"]*"/gim, "")
               .replace(/javascript:/gim, "");
  };

  if (!article) return <div className="pt-32 text-center">הכתבה לא נמצאה</div>;

  const whatsappCtaUrl = "https://wa.me/972557294069?text=היי%20ניב,%20ראיתי%20את%20האתר%20ואני%20רוצה%20שיחת%20אבחון%20קצרה";
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-alma-primary font-medium mb-10 hover:underline transition-all group"
        >
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          חזרה למגזין התובנות
        </button>

        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="bg-alma-primary/10 text-alma-primary px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
              {article.category}
            </span>
            <div className="h-px flex-grow bg-gray-100"></div>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-extrabold text-alma-dark mb-8 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-between gap-6 border-y border-gray-100 py-6">
            <div className="flex flex-wrap gap-6 text-gray-500 text-sm">
              <div className="flex items-center gap-2">
                <User size={16} className="text-alma-primary" />
                <span className="font-medium text-gray-900">{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{article.readMinutes} דקות קריאה</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full border border-gray-100 text-gray-400 hover:text-alma-primary hover:border-alma-primary transition-all"
                aria-label="Share on Facebook"
              >
                <Facebook size={18} />
              </a>
              <button 
                onClick={() => navigator.share?.({ title: article.title, url: shareUrl })}
                className="p-2 rounded-full border border-gray-100 text-gray-400 hover:text-alma-primary hover:border-alma-primary transition-all"
                aria-label="Share"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className={`w-full aspect-video rounded-[40px] ${article.bgColor} flex items-center justify-center mb-16 shadow-inner relative overflow-hidden group`}>
           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50"></div>
           <article.icon size={120} className={`${article.color} relative z-10 transform group-hover:scale-110 transition-transform duration-700`} />
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed space-y-8">
            <p className="text-2xl font-semibold text-alma-dark leading-snug">
              {article.content}
            </p>
            
            <div 
              className="article-body-content text-xl space-y-8 text-gray-600"
              dangerouslySetInnerHTML={{ __html: sanitize(article.fullContent || '') }} 
            />
          </div>

          <div className="my-16 p-10 bg-gray-50 rounded-3xl border-r-8 border-alma-primary italic">
            <p className="text-2xl text-alma-dark font-medium leading-relaxed">
              "ההבדל בין עסק שמנסה לשרוד לעסק שצומח בעקביות הוא לא כמות הלידים, אלא איכות המנגנון שמטפל בהם."
            </p>
            <p className="mt-4 text-gray-500 font-bold">: נבחרת עלמה?</p>
          </div>

          <div className="mt-24 border-t border-gray-100 pt-16">
            <h3 className="text-2xl font-bold text-alma-dark mb-10">תובנות נוספות שעשויות לעניין אותך</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {related.map((item) => (
                <div 
                  key={item.slug}
                  onClick={() => onSelectOther(item.slug)}
                  className="group cursor-pointer"
                >
                  <div className={`aspect-video rounded-2xl ${item.bgColor} flex items-center justify-center mb-4 transition-all group-hover:shadow-lg`}>
                    <item.icon size={48} className={item.color} />
                  </div>
                  <h4 className="text-xl font-bold text-alma-dark group-hover:text-alma-primary transition-colors mb-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-24 p-8 lg:p-16 bg-alma-dark text-white rounded-[60px] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-alma-primary rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-alma-accent rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 text-center">
            <h3 className="text-3xl lg:text-4xl font-bold mb-6">התובנה הזו היא רק קצה הקרחון</h3>
            <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
              אנחנו הופכים עסקים רגילים למכונות שיווק משומנות. בואו נראה איך היסודות האלה נראים אצלכם בעסק בשיחת אבחון אחת ללא עלות.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <a href={whatsappCtaUrl} target="_blank" rel="noreferrer">
                  <Button className="bg-white text-alma-dark hover:bg-gray-100 w-full sm:w-auto">
                    דברו איתי בוואטסאפ <Send size={18} className="mr-2" />
                  </Button>
               </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetail;