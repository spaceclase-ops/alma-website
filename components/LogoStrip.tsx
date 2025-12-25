import React from 'react';

const LogoStrip: React.FC = () => {
  // רשימת הלוגואים
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

  // מכפילים את המערך שלוש פעמים כדי להבטיח רצף מלא במסכים רחבים
  const tripleLogos = [...logos, ...logos, ...logos];

  return (
    <div className="py-12 bg-white border-y border-gray-100 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 mb-8 text-center relative z-10">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
          לקוחות שבחרו ב"עלמה?"
        </h2>
      </div>
      
      <div className="marquee-container overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap items-center w-max">
          {tripleLogos.map((logo, index) => (
            <div 
              key={index} 
              className="mx-10 md:mx-16 flex-shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                <img 
                  src={logo.path} 
                  alt={logo.name} 
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const parent = target.parentElement;
                    if (parent) {
                      target.style.display = 'none';
                      const span = document.createElement('span');
                      span.className = 'text-gray-300 font-bold text-sm';
                      span.innerText = logo.name;
                      parent.appendChild(span);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogoStrip;

