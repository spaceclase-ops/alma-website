# MEMORY — alma-website

סיכום טכני לסשנים הבאים: מה יש בפרויקט, איך הוא בנוי ואיך עובדים איתו.

## מה זה
האתר של **עלמה (Alma Digital)**, סוכנות שיווק דיגיטלי. אתר תדמית בעברית (RTL) עם דף בית, שירותים, אודות, המלצות, תובנות (מאמרים), שאלות נפוצות, צור קשר ועמודים משפטיים. הפרויקט התחיל כתבנית של Google AI Studio.

## טכנולוגיות
- **Vite 6 + React 19 + TypeScript 5.8**, ניתוב עם `react-router-dom` 7 (`BrowserRouter` ב-`index.tsx`)
- **Tailwind מ-CDN** (`cdn.tailwindcss.com` ב-`index.html`) עם `tailwind.config` inline. צבעי המותג: `alma.dark #0f172a`, `alma.primary #0ea5e9`, `alma.accent #2dd4bf`, `alma.light #f0f9ff`
- פונט **Rubik** מ-Google Fonts. אייקונים מ-`lucide-react`
- טפסים נשלחים ל-**Web3Forms**. המפתח ב-`VITE_WEB3FORMS_ACCESS_KEY` (ב-`.env.local`, לא ב-git; התבנית ב-`.env.example`)
- **Meta Pixel** ב-`index.html`
- פריסה: `vercel.json` ו-`netlify.toml` מפנים כל נתיב ל-`index.html` (SPA, מונע 404 ברענון)

## מבנה קבצים
```
index.html            Tailwind config, פונטים, CSS גלובלי (נגישות, marquee, lightbox), Meta Pixel
index.tsx             נקודת כניסה + BrowserRouter
App.tsx               ה-Routes וסדר הסקשנים בדף הבית
types.ts              ServiceItem, TestimonialItem, NavItem
components/           Header, Hero, LogoStrip, Services(+Page), About(+Page), Testimonials(+Page),
                      VideoCarousel (YouTube Shorts + Lightbox), Insights(+Page), ArticleDetail,
                      Contact(+Page), FAQPage, Footer, LegalPageLayout, CookieConsent, AccessibilityWidget, Button
data/insightsData.ts  תוכן המאמרים
public/images/        לוגואים של לקוחות (strip*.png), תמונות אודות, תמונות מאמרים
design-extractor/     כלי לחילוץ עיצוב מלא מאתר חי (ראו למטה). לא חלק מהבילד של האתר
```

**נתיבים:** `/`, `/services`, `/about`, `/testimonials`, `/insights`, `/insights/:slug`, `/faq`, `/contact`, `/legal/:slug`

**דף הבית (לפי הסדר):** Hero → LogoStrip → Services → About → Testimonials → VideoCarousel → Insights → Contact

## דפוסים
- כל עמוד פנימי מקבל `onBack` / `onContactClick` כ-props. הניווט עובר דרך `useNavigate` ב-`App.tsx`
- עיצוב ב-utility classes של Tailwind ישירות ב-JSX. ‏CSS מותאם רק ב-`index.html`
- **לא לגעת** ב-`CookieConsent` וב-`AccessibilityWidget` (נגישות ופרטיות. דרישה חוזרת של ניב)
- קבצי תמונה בעברית בשמות ב-`public/images`

## design-extractor (נוסף ב-27.09.2026)
כלי Node ‏(Playwright + Chromium) שמודד את העיצוב של כל אתר: טוקנים, טיפוגרפיה, פריסה, קומפוננטות, hover, תנועה וצילומי מסך בשלושה מסכים.
- הרצה: `cd design-extractor && npm install && npx playwright install chromium && node extract.mjs <url> --pages 8`. התוצר נכתב ל-`design-extractor/sites/<domain>/`
- קבצים: `extract.mjs` (ניהול הדפדפן), `inpage.js` (מדידה בתוך הדף), `analyze.mjs` (טוקנים + דוח), `color.mjs` (צבע/ΔE), `selftest.mjs` (67 בדיקות על אתר בדיקה מקומי), `compare.mjs` (השוואת שחזור לצילום המקורי, פיקסל מול פיקסל)
- **אתרים "מואצים" (WP Rocket ודומיו):** ה-JS כולו מעוכב עד אינטראקציה. הכלי מדמה תנועת עכבר, מכריח `content-visibility: visible`, טוען תמונות עצלות (`data-lazy-src`) ומציג שכבות Motion FX של Elementor. בלי זה הצילומים יוצאים לבנים, וה-header "לא דביק"
- **הדוח האוטומטי מסכם את כל העמודים יחד.** לכן הערכים שלו (H1, צבע משני, ריפוד סקשנים) לא תמיד נכונים לדף הבית. המקור המחייב הוא `DESIGN_SYSTEM.md` שנכתב ידנית אחרי בדיקה מול הצילומים וה-CSS
- **gnss.co.il (05.10.2026):** חולץ במלואו. הקבצים: `sites/gnss.co.il/DESIGN_SYSTEM.md` (המפרט בעברית), `replica-test.html` (שחזור header ו-hero), `replica/` (השוואות). השחזור זהה למקור בגאומטריה, עם הפרש 0.9% בדסקטופ ו-1.3% במובייל
- ‏`fonts/` ו-`images/` נשארים מקומיים (gitignore). `replica-test.html` צריך אותם כדי להיראות נכון
- ל-`package.json` נפרד משלו, כך שהוא לא משפיע על הבילד של האתר ב-Vercel/Netlify
- בסשן ענן: הדפדפן יוצא דרך הפרוקסי של הסביבה, ו-CA הפרוקסי מאומת בנעיצת SPKI (לא מכבים אימות TLS). צריך להתיר את דומיין היעד ב-Network access של הסביבה
- פונטים ותמונות שחולצו לא נכנסים ל-git (רישיונות)

## פקודות
```
npm install && npm run dev          # האתר, פורט 3000
npm run build                       # בילד ל-dist/
cd design-extractor && node selftest.mjs   # בדיקת הכלי (67/67)
cd design-extractor && node compare.mjs <page.html> <reference.jpg> --viewport 1440x900   # השוואת שחזור
```
