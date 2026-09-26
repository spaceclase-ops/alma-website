import React from 'react';

const LogoStrip: React.FC = () => {
  // רשימת כל 29 הלוגואים כולל הסטריפים החדשים
  const logos = [
    { name: 'B-Cure Laser', path: '/images/B-Cure-Laser.png' },
    { name: 'Smoovee', path: '/images/Smoovee.webp' },
    { name: 'UFC', path: '/images/UFC.webp' },
    { name: 'Great Shape', path: '/images/great-shape.webp' },
    { name: 'Kiki Party', path: '/images/kiki-party.webp' },
    { name: 'גוסטינו', path: '/images/gustino.webp' },
    { name: 'עמותת החתולים בישראל', path: '/images/עמותת החתולים בישרל .png' },
    { name: 'קאנטרי נשר', path: '/images/country-nesher.webp' },
    { name: 'קאנטרי רמות', path: '/images/קאנטרי-רמות.png' },
    { name: 'Strip 1', path: '/images/strip1.webp' },
    { name: 'Strip 2', path: '/images/strip2.webp' },
    { name: 'Strip 3', path: '/images/strip3.webp' },
    { name: 'Strip 4', path: '/images/strip4.webp' },
    { name: 'Strip 5', path: '/images/strip5.webp' },
    { name: 'Strip 6', path: '/images/strip6.webp' },
    { name: 'Strip 7', path: '/images/strip7.webp' },
    { name: 'Strip 9', path: '/images/strip9.webp' },
    { name: 'Strip 10', path: '/images/strip10.webp' },
    { name: 'Strip 11', path: '/images/strip11.webp' },
    { name: 'Strip 12', path: '/images/strip12.webp' },
    { name: 'Strip 13', path: '/images/strip13.webp' },
    { name: 'Strip 14', path: '/images/strip14.webp' },
    { name: 'Strip 15', path: '/images/strip15.webp' },
    { name: 'Strip 16', path: '/images/strip16.webp' },
    { name: 'Strip 17', path: '/images/strip17.webp' },
    { name: 'Strip 18', path: '/images/strip18.webp' },
    { name: 'Strip 19', path: '/images/strip19.webp' },
    { name: 'Strip 20', path: '/images/strip20.webp' },
    { name: 'Strip 21', path: '/images/strip21.webp' },
  ];

  // מכפילים את המערך 4 פעמים כדי ליצור לופ חלק ללא קפיצות
  const quadrupledLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="py-8 md:py-16 bg-white border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6 md:mb-10 text-center">
        <h2 className="text-gray-600 text-xl md:text-2xl font-extrabold uppercase tracking-[0.15em]">
          לקוחות שבחרו ב"עלמה?"
        </h2>
      </div>
      
      <div className="marquee-container relative">
        <div className="animate-marquee-rtl flex items-center">
          {quadrupledLogos.map((logo, index) => {
            const isSmallLogo = logo.name === 'B-Cure Laser' || logo.name === 'עמותת החתולים בישראל';
            return (
            <div 
              key={`${logo.name}-${index}`} 
              className="logo-item mx-6 md:mx-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            >
              <img 
                src={logo.path} 
                alt={logo.name} 
                className={isSmallLogo 
                  ? "h-16 md:h-[106px] w-auto object-contain max-w-[213px] md:max-w-[320px]"
                  : "h-48 md:h-80 w-auto object-contain max-w-[320px] md:max-w-[640px]"
                }
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LogoStrip;

