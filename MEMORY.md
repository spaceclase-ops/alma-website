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
- הרצה: `cd design-extractor && npm install && node extract.mjs <url>`. התוצר נכתב ל-`design-extractor/sites/<domain>/`
- קבצים: `extract.mjs` (ניהול הדפדפן), `inpage.js` (מדידה בתוך הדף), `analyze.mjs` (טוקנים + דוח), `color.mjs` (צבע/ΔE), `selftest.mjs` (60 בדיקות על אתר בדיקה מקומי)
- ל-`package.json` נפרד משלו, כך שהוא לא משפיע על הבילד של האתר ב-Vercel/Netlify
- בסשן ענן: הדפדפן יוצא דרך הפרוקסי של הסביבה, ו-CA הפרוקסי מאומת בנעיצת SPKI (לא מכבים אימות TLS). צריך להתיר את דומיין היעד ב-Network access של הסביבה
- פונטים ותמונות שחולצו לא נכנסים ל-git (רישיונות)

## פקודות
```
npm install && npm run dev          # האתר, פורט 3000
npm run build                       # בילד ל-dist/
cd design-extractor && node selftest.mjs   # בדיקת הכלי
```
