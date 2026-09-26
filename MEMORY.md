# MEMORY – alma-website

סיכום טכני של הפרויקט, לשימוש בכל סשן עבודה הבא.

## מה זה
האתר של **"עלמה?" – חברה לצמיחה ופיתוח עסקי** (ניב עיני, הגיא 25 יקנעם עילית, 055-7294068).
אתר תדמית בעברית (RTL): דף בית, שירותים, קצת עלינו, המלצות, מגזין תובנות (12 מאמרים),
שאלות נפוצות, צור קשר, 4 דפים משפטיים.

- ריפו: `spaceclase-ops/alma-website`, ענף `main` = production.
- אחסון: Vercel. כתובת Vercel: `alma-website-ten.vercel.app` (שדה Website בריפו).
  הדומיין `alma-ads.co.il` מפנה ב-DNS ל-Vercel. הפרויקט נמצא בחשבון Vercel שאינו
  "almaads' projects" (כנראה של spaceclase-ops).
- `netlify.toml` קיים כגיבוי בלבד.

## טכנולוגיות
- React 19 + TypeScript, Vite 6, React Router 7 (`BrowserRouter` בדפדפן, `StaticRouter` ב-build).
- Tailwind CSS 3.4 מקומפל בזמן build (`tailwind.config.js`, `postcss.config.js`, `index.css`).
  אין CDN. בלוק ה-`<style>` ב-`index.html` (נגישות, marquee, lightbox) נשאר CSS רגיל.
- `lucide-react` לאייקונים. פונט Rubik מ-Google Fonts.
- טפסים: Web3Forms (`VITE_WEB3FORMS_ACCESS_KEY`).
- Meta Pixel `660125253756573` ב-`index.html` + אירועים ב-`App.tsx`.

## מבנה קבצים
```
index.html          תבנית: <!-- seo:start/end --> (מוחלף לכל דף), <div id="root"><!--app-html--></div>
index.tsx           כניסה בדפדפן: hydrateRoot אם יש HTML מוכן, אחרת createRoot (vite dev)
entry-server.tsx    כניסה ל-build: render(url) עם React 19 prerender + StaticRouter
prerender.mjs       יוצר dist/<route>.html לכל דף, 404.html, sitemap.xml, robots.txt
App.tsx             ניתוב, applyPageMeta בכל ניווט, NotFound, הפניית כתובות מאמרים ישנות, דפים משפטיים
navigation.ts       isPlainLeftClick – קישור אמיתי + ניווט בתוך האפליקציה
types.ts            ServiceItem, TestimonialItem, NavItem (href=#section, path=כתובת אמיתית)
components/         כל הקומפוננטות (Header, Hero, Services, About, Testimonials, Insights, ...)
data/site.ts        פרטי העסק + SITE_URL (מוזרק מ-vite.config.ts)
data/seo.ts         כותרת/תיאור לכל דף, JSON-LD, renderHeadTags (build), applyPageMeta (דפדפן)
data/insightsData.ts  12 המאמרים, slug לכל מאמר, legacyInsightSlugs (insight-1..12)
data/faqData.ts     12 השאלות הנפוצות (דף + FAQPage schema)
public/images/      תמונות. בשימוש: *.webp, insight-<slug>-{1280,640}.webp, insight-<slug>-og.jpg, og-default.jpg
vercel.json         buildCommand, cleanUrls, trailingSlash=false, הפניות 308, cache ל-/assets
```

## איך הבנייה עובדת (`npm run build`)
1. `vite build` → `dist/` (JS + CSS עם hash).
2. `vite build --ssr entry-server.tsx --outDir dist-ssr` (בלי העתקת public).
3. `node prerender.mjs`: לכל כתובת מ-`getPrerenderRoutes()` מרנדר HTML, מזריק `<head>` מ-`renderHeadTags()`
   וכותב `dist/services.html`, `dist/insights/<slug>.html` וכו'. בסוף מוחק את `dist-ssr`.
   הבנייה נכשלת אם: לדף אין `<h1>`, JSON-LD לא תקין, או שההפניות ב-vercel.json/netlify.toml
   לא תואמות ל-`legacyInsightSlugs`.
- ב-Vercel, `cleanUrls` מגיש את `services.html` בכתובת `/services`. כתובת לא קיימת מקבלת `404.html` עם סטטוס 404.
- `SITE_URL` = `https://${VERCEL_PROJECT_PRODUCTION_URL}` ב-Vercel, אחרת `https://alma-ads.co.il`.

## SEO / GEO – מה קיים
- כל דף מגיע כ-HTML מלא (בוטים של גוגל ושל עוזרי AI רואים את כל התוכן בלי JavaScript).
- לכל דף: title, description, canonical, Open Graph, Twitter card.
- JSON-LD: ProfessionalService (עלמה?, כתובת, טלפון, שעות א'-ה' 09:00-18:00, שירותים, פייסבוק),
  Person (ניב עיני), WebSite, WebPage/AboutPage/ContactPage/CollectionPage, FAQPage, BlogPosting, BreadcrumbList.
- `sitemap.xml` + `robots.txt` נוצרים אוטומטית.
- בדיקה מהירה: `curl -s https://alma-ads.co.il/faq | grep -c "question"` או לפתוח View Source.

## איך מוסיפים
**מאמר חדש**
1. `data/insightsData.ts`: אובייקט חדש ב-`rawArticles` (id הבא) + slug באנגלית ב-`slugById`. לא לשנות slug קיים.
2. תמונה 1920x1200 → שלושה קבצים ב-`public/images` (sharp):
   `resize(1280,800).webp({quality:80})` → `insight-<slug>-1280.webp`,
   `resize(640,400).webp({quality:80})` → `insight-<slug>-640.webp`,
   `resize(1200,750).jpeg({quality:80, mozjpeg:true})` → `insight-<slug>-og.jpg`.
3. כל השאר (עמוד, כותרת, sitemap, schema) נוצר אוטומטית. לא צריך הפניה.

**דף חדש**
1. קומפוננטה + `<Route>` ב-`App.tsx`.
2. רשומה ב-`staticPages` ב-`data/seo.ts` (path, name, title, description).
3. קישור `<a href>` בתפריט/פוטר עם `isPlainLeftClick`.

**תמונות**: להעלות WebP מוקטן, לא PNG של כמה MB.

## כללים ודפוסים
- קישור פנימי = `<a href="/path">` + ב-onClick: `if (!isPlainLeftClick(e)) return; e.preventDefault(); navigate(...)`.
- בזמן render אסור להשתמש ב-`window`/`document`/`localStorage`/`Math.random`/`Date.now` –
  רק ב-`useEffect` או ב-handlers. אחרת ה-HTML המוכן לא תואם לדפדפן (hydration error).
- מיתוג: השם **"עלמה?"**, התיאור **"צמיחה ופיתוח עסקי"**. טלפון **055-7294068**.
- לפני push: `npm run build` חייב לעבור.

## ידוע / לטיפול בהמשך
- התאריכים במאמרים מחושבים בקוד (`generateStableDate`) ולא אמיתיים. לכן אין `datePublished` ב-schema.
  צריך תאריכי פרסום אמיתיים.
- `tsc --noEmit`: שתי שגיאות ישנות (`import.meta.env` בלי טיפוסי vite/client). Vite לא בודק טיפוסים.
- ב-`public/images` יש קבצי מקור גדולים שכבר לא בשימוש (~100MB). אפשר למחוק.
- אין favicon ואין קובץ לוגו (מומלץ ל-schema ולתוצאות גוגל).
- לוודא ב-Vercel ש-`alma-ads.co.il` הוא הדומיין הראשי ושכתובת ה-vercel.app מפנה אליו.
