import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LegalPageProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageProps> = ({ title, onBack, children }) => {
  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-alma-primary font-medium mb-10 hover:underline transition-all group"
        >
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          חזרה לדף הבית
        </button>

        <header className="mb-12 border-b border-gray-100 pb-8">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-alma-dark mb-4">
            {title}
          </h1>
          <p className="text-gray-500">עודכן לאחרונה: פברואר 2024</p>
        </header>

        <article className="prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed space-y-6 text-right">
          {children}
        </article>
      </div>
    </div>
  );
};

export default LegalPageLayout;