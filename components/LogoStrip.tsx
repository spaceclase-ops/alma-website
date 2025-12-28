import React from 'react';

const LogoStrip: React.FC = () => {
  // רשימת כל 29 הלוגואים כולל הסטריפים החדשים
  const logos = [
    { name: 'B-Cure Laser', path: '/images/B-Cure-Laser.png' },
    { name: 'Smoovee', path: '/images/Smoovee.png' },
    { name: 'UFC', path: '/images/UFC.png' },
    { name: 'Great Shape', path: '/images/great-shape.png' },
    { name: 'Kiki Party', path: '/images/kiki-party.png' },
    { name: 'גוסטינו', path: '/images/גוסטינו.png' },
    { name: 'עמותת החתולים בישראל', path: '/images/עמותת החתולים בישרל .png' },
    { name: 'קאנטרי נשר', path: '/images/קאנטרי-נשר.png' },
    { name: 'קאנטרי רמות', path: '/images/קאנטרי-רמות.png' },
    { name: 'Strip 1', path: '/images/strip1.png' },
    { name: 'Strip 2', path: '/images/strip2.png' },
    { name: 'Strip 3', path: '/images/strip3.png' },
    { name: 'Strip 4', path: '/images/strip4.png' },
    { name: 'Strip 5', path: '/images/strip5.png' },
    { name: 'Strip 6', path: '/images/strip6.png' },
    { name: 'Strip 7', path: '/images/strip7.png' },
    { name: 'Strip 9', path: '/images/strip9.png' },
    { name: 'Strip 10', path: '/images/strip10.png' },
    { name: 'Strip 11', path: '/images/strip11.png' },
    { name: 'Strip 12', path: '/images/strip12.png' },
    { name: 'Strip 13', path: '/images/strip13.png' },
    { name: 'Strip 14', path: '/images/strip14.png' },
    { name: 'Strip 15', path: '/images/strip15.png' },
    { name: 'Strip 16', path: '/images/strip16.png' },
    { name: 'Strip 17', path: '/images/strip17.png' },
    { name: 'Strip 18', path: '/images/strip18.png' },
    { name: 'Strip 19', path: '/images/strip19.png' },
    { name: 'Strip 20', path: '/images/strip20.png' },
    { name: 'Strip 21', path: '/images/strip21.png' },
  ];

  // מכפילים את המערך כדי ליצור לופ חלק
  const doubledLogos = [...logos, ...logos];

  return (
    <div className="py-8 md:py-16 bg-white border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6 md:mb-10 text-center">
        <h2 className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
          לקוחות שבחרו ב"עלמה?"
        </h2>
      </div>
      
      <div className="marquee-container relative">
        <div className="animate-marquee-rtl flex items-center">
          {doubledLogos.map((logo, index) => (
            <div 
              key={`${logo.name}-${index}`} 
              className="logo-item mx-6 md:mx-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            >
              <img 
                src={logo.path} 
                alt={logo.name} 
                className="h-12 md:h-20 w-auto object-contain max-w-[160px] md:max-w-[240px]"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  const parent = target.parentElement;
                  if (parent) {
                    target.style.display = 'none';
                    const span = document.createElement('span');
                    span.className = 'text-gray-300 font-bold text-[10px] md:text-xs whitespace-nowrap';
                    span.innerText = logo.name;
                    parent.appendChild(span);
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoStrip;

