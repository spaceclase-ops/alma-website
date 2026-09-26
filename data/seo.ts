import { insights, legacyInsightSlugs, type Insight } from './insightsData';
import { faqs } from './faqData';
import { services } from '../components/Services';
import {
  SITE_URL,
  BRAND_NAME,
  BRAND_CATEGORY,
  PHONE_DISPLAY,
  PHONE_INTERNATIONAL,
  EMAIL,
  STREET_ADDRESS,
  CITY,
  FOUNDER_NAME,
  FOUNDING_YEAR,
  FACEBOOK_URL,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
} from './site';

// Search/AI metadata for every URL of the site, from a single source:
//  - prerender.mjs writes it into the <head> of each static HTML page (what crawlers read)
//  - App.tsx calls applyPageMeta() on in-app navigation (tab title, canonical, share tags)

type SchemaPageType = 'WebPage' | 'AboutPage' | 'ContactPage' | 'FAQPage' | 'CollectionPage';

interface Crumb {
  name: string;
  path: string;
}

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  image: { path: string; width: number; height: number };
  ogType: 'website' | 'article';
  schemaType: SchemaPageType;
  breadcrumb: Crumb[];
  noindex?: boolean;
  insight?: Insight;
}

export const NOT_FOUND_PATH = '/404';

const ORG_DESCRIPTION =
  'עלמה? היא חברה לצמיחה ופיתוח עסקי. אנחנו מאבחנים ובונים לעסקים מנגנון שיווק ומכירות – זהות ומסר, תהליך מכירה, אסטרטגיה, תוכן ונראות – ורק אז מפעילים פרסום.';

interface StaticPage {
  path: string;
  name: string; // breadcrumb label
  title: string;
  description: string;
  schemaType?: SchemaPageType;
}

const staticPages: StaticPage[] = [
  {
    path: '/',
    name: 'דף הבית',
    title: 'עלמה? | צמיחה ופיתוח עסקי – בניית מנגנוני שיווק ומכירות',
    description: `עלמה? היא חברה לצמיחה ופיתוח עסקי. אנחנו מאבחנים ובונים לעסקים מנגנון שיווק ומכירות – זהות, תהליך מכירה ואסטרטגיה – ורק אז מפרסמים. שיחת אבחון: ${PHONE_DISPLAY}`,
  },
  {
    path: '/services',
    name: 'השירותים שלנו',
    title: 'השירותים שלנו | עלמה? – צמיחה ופיתוח עסקי',
    description:
      'זהות לעסק, מנגנוני שיווק, תהליך מכירה מסודר, אסטרטגיה, תוכן ונראות. עלמה? בונה את המנוע של העסק – ורק אז לוחצת על הגז ומפרסמת.',
  },
  {
    path: '/about',
    name: 'קצת עלינו',
    title: 'קצת עלינו | עלמה? – צמיחה ופיתוח עסקי',
    description: `עלמה? – חברה לצמיחה ופיתוח עסקי בהובלת ${FOUNDER_NAME}. משרד ליווי אסטרטגי ושיווקי הפועל משנת ${FOUNDING_YEAR}, שליווה מעל 178 עסקים בשירות, קמעונאות, פיטנס ומכירות.`,
    schemaType: 'AboutPage',
  },
  {
    path: '/testimonials',
    name: 'המלצות',
    title: 'המלצות לקוחות | עלמה? – צמיחה ופיתוח עסקי',
    description:
      'מה אומרים הלקוחות של עלמה?: רשת גרייט שייפ, B-Cure Laser, קאנטרי נשר, קאנטרי רמות, UFC ISRAEL, SMOOVEE, גוסטינו ועוד – על מנגנון שיווק ומכירות שעובד.',
  },
  {
    path: '/insights',
    name: 'מגזין תובנות',
    title: 'מגזין תובנות לעסקים | עלמה?',
    description:
      'מאמרים על אסטרטגיה, תמחור, מכירות ומנגנוני שיווק – השיעורים שלמדנו מליווי של מאות עסקים. בלי פילטרים, רק מה שעובד באמת.',
    schemaType: 'CollectionPage',
  },
  {
    path: '/faq',
    name: 'שאלות נפוצות',
    title: 'שאלות נפוצות | עלמה? – צמיחה ופיתוח עסקי',
    description:
      'מה עלמה? עושה, עם מי אנחנו עובדים, כמה זמן לוקח לראות תוצאות, כמה זה עולה ומה ההבדל בינינו לבין יועץ עסקי – כל התשובות במקום אחד.',
    schemaType: 'FAQPage',
  },
  {
    path: '/contact',
    name: 'צור קשר',
    title: 'צור קשר ושיחת אבחון | עלמה?',
    description: `קבעו שיחת אבחון עם עלמה? – צמיחה ופיתוח עסקי. טלפון ${PHONE_DISPLAY}, ${EMAIL}, ${STREET_ADDRESS}, ${CITY}. א׳–ה׳ 09:00–18:00.`,
    schemaType: 'ContactPage',
  },
  {
    path: '/legal/privacy-policy',
    name: 'מדיניות פרטיות',
    title: 'מדיניות פרטיות | עלמה?',
    description: 'מדיניות הפרטיות של אתר עלמה?: איזה מידע נאסף, איך משתמשים בו ומה הזכויות שלכם.',
  },
  {
    path: '/legal/terms-of-use',
    name: 'תנאי שימוש',
    title: 'תנאי שימוש | עלמה?',
    description: 'תנאי השימוש באתר עלמה?: קניין רוחני, הגבלת אחריות ותנאים כלליים.',
  },
  {
    path: '/legal/cookie-policy',
    name: 'מדיניות עוגיות',
    title: 'מדיניות עוגיות | עלמה?',
    description: 'אילו עוגיות (Cookies) משמשות באתר עלמה? ואיך אפשר לנהל אותן.',
  },
  {
    path: '/legal/accessibility-statement',
    name: 'הצהרת נגישות',
    title: 'הצהרת נגישות | עלמה?',
    description: 'הצהרת הנגישות של אתר עלמה?: ההתאמות שבוצעו לפי ת״י 5568 ברמה AA ופרטי רכז הנגישות.',
  },
];

const HOME_CRUMB: Crumb = { name: 'דף הבית', path: '/' };
const INSIGHTS_CRUMB: Crumb = { name: 'מגזין תובנות', path: '/insights' };
const ARTICLE_OG_IMAGE_SIZE = { width: 1200, height: 750 };

const plainText = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// Cut on a word boundary so descriptions stay within what search results display.
function excerpt(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.:;–-]+$/, '')}…`;
}

const articleText = (insight: Insight) => `${insight.content} ${plainText(insight.fullContent)}`;

function normalizePath(pathname: string): string {
  let path = pathname.split(/[?#]/)[0] || '/';
  try {
    path = decodeURI(path);
  } catch {
    // keep the raw path
  }
  return path.length > 1 ? path.replace(/\/+$/, '') : '/';
}

function insightMeta(insight: Insight): PageMeta {
  const path = `/insights/${insight.slug}`;
  return {
    path,
    title: `${insight.title} | עלמה?`,
    description: excerpt(articleText(insight)),
    image: { path: insight.ogImage, ...ARTICLE_OG_IMAGE_SIZE },
    ogType: 'article',
    schemaType: 'WebPage',
    breadcrumb: [HOME_CRUMB, INSIGHTS_CRUMB, { name: insight.title, path }],
    insight,
  };
}

function notFoundMeta(path: string): PageMeta {
  return {
    path,
    title: 'הדף לא נמצא | עלמה?',
    description: 'הדף שחיפשתם לא נמצא. אפשר לחזור לדף הבית של עלמה? – צמיחה ופיתוח עסקי.',
    image: DEFAULT_OG_IMAGE,
    ogType: 'website',
    schemaType: 'WebPage',
    breadcrumb: [],
    noindex: true,
  };
}

export function getPageMeta(pathname: string): PageMeta {
  const path = normalizePath(pathname);

  const page = staticPages.find((p) => p.path === path);
  if (page) {
    return {
      path,
      title: page.title,
      description: page.description,
      image: DEFAULT_OG_IMAGE,
      ogType: 'website',
      schemaType: page.schemaType ?? 'WebPage',
      breadcrumb: path === '/' ? [] : [HOME_CRUMB, { name: page.name, path }],
    };
  }

  const article = path.match(/^\/insights\/([^/]+)$/);
  if (article) {
    const slug = legacyInsightSlugs[article[1]] ?? article[1];
    const insight = insights.find((i) => i.slug === slug);
    if (insight) return insightMeta(insight);
  }

  return notFoundMeta(path);
}

// Every URL that gets its own static HTML file (and a sitemap entry).
export function getPrerenderRoutes(): string[] {
  return [...staticPages.map((p) => p.path), ...insights.map((i) => `/insights/${i.slug}`)];
}

// ---------------------------------------------------------------------------
// Structured data (schema.org JSON-LD)
// ---------------------------------------------------------------------------

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const FOUNDER_ID = `${SITE_URL}/#founder`;

function organizationNode() {
  return {
    '@type': 'ProfessionalService',
    '@id': ORG_ID,
    name: BRAND_NAME,
    alternateName: ['עלמה', `עלמה – ${BRAND_CATEGORY}`, 'Alma'],
    description: ORG_DESCRIPTION,
    slogan: 'פרסום בלי מנגנון הוא בזבוז כסף',
    url: `${SITE_URL}/`,
    telephone: PHONE_INTERNATIONAL,
    email: EMAIL,
    image: absoluteUrl(DEFAULT_OG_IMAGE.path),
    foundingDate: FOUNDING_YEAR,
    founder: { '@id': FOUNDER_ID },
    address: {
      '@type': 'PostalAddress',
      streetAddress: STREET_ADDRESS,
      addressLocality: CITY,
      addressCountry: 'IL',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    sameAs: [FACEBOOK_URL],
    knowsAbout: [
      'צמיחה עסקית',
      'פיתוח עסקי',
      'אסטרטגיה עסקית',
      'אסטרטגיה שיווקית',
      'בניית מנגנוני שיווק',
      'תהליכי מכירה',
      'מיתוג ובניית זהות לעסק',
      'שיווק דיגיטלי',
      'פרסום ממומן',
      'תוכן שיווקי',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `שירותי ${BRAND_CATEGORY}`,
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.description },
      })),
    },
  };
}

function founderNode() {
  return {
    '@type': 'Person',
    '@id': FOUNDER_ID,
    name: FOUNDER_NAME,
    jobTitle: 'מייסד ומנכ״ל',
    worksFor: { '@id': ORG_ID },
    description:
      'מומחה מכירות ושיווק משנת 2006. ניהל מערכי מכירה בארגונים גדולים, בנה צוותים, פיתח תסריטי שיחה וליווה עסקים מקרוב בשטח.',
    knowsAbout: ['מכירות', 'שיווק', 'בניית תהליכי מכירה', 'ניהול צוותי מכירה', 'אסטרטגיה עסקית'],
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: BRAND_NAME,
    alternateName: `עלמה – ${BRAND_CATEGORY}`,
    inLanguage: 'he-IL',
    publisher: { '@id': ORG_ID },
  };
}

export function buildJsonLd(meta: PageMeta) {
  const pageUrl = absoluteUrl(meta.path);
  const webPage: Record<string, unknown> = {
    '@type': meta.schemaType,
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: meta.title,
    description: meta.description,
    inLanguage: 'he-IL',
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORG_ID },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: absoluteUrl(meta.image.path),
      width: meta.image.width,
      height: meta.image.height,
    },
  };

  const graph: Record<string, unknown>[] = [organizationNode(), founderNode(), websiteNode(), webPage];

  if (meta.schemaType === 'FAQPage') {
    webPage.mainEntity = faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    }));
  }

  if (meta.breadcrumb.length) {
    webPage.breadcrumb = { '@id': `${pageUrl}#breadcrumb` };
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: meta.breadcrumb.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    });
  }

  if (meta.insight) {
    const text = articleText(meta.insight);
    graph.push({
      '@type': 'BlogPosting',
      '@id': `${pageUrl}#article`,
      headline: meta.insight.title,
      description: meta.description,
      image: absoluteUrl(meta.insight.ogImage),
      inLanguage: 'he-IL',
      articleSection: meta.insight.category,
      wordCount: text.split(/\s+/).length,
      author: { '@id': FOUNDER_ID },
      publisher: { '@id': ORG_ID },
      mainEntityOfPage: { '@id': `${pageUrl}#webpage` },
      isPartOf: { '@id': WEBSITE_ID },
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// ---------------------------------------------------------------------------
// <head> output
// ---------------------------------------------------------------------------

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// JSON inside <script> must not contain "</script>".
const jsonForScript = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');

// Static <head> tags for prerendered pages.
export function renderHeadTags(meta: PageMeta): string {
  const url = absoluteUrl(meta.path);
  const image = absoluteUrl(meta.image.path);
  const tags = [
    `<title>${escapeAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`,
    meta.noindex
      ? '<meta name="robots" content="noindex, follow" />'
      : `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:type" content="${meta.ogType}" />`,
    `<meta property="og:site_name" content="${escapeAttr(BRAND_NAME)}" />`,
    '<meta property="og:locale" content="he_IL" />',
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta property="og:image:width" content="${meta.image.width}" />`,
    `<meta property="og:image:height" content="${meta.image.height}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`,
  ];
  if (!meta.noindex) {
    tags.push(`<script type="application/ld+json">${jsonForScript(buildJsonLd(meta))}</script>`);
  }
  return tags.join('\n    ');
}

function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Keeps the <head> in sync during in-app navigation. Crawlers load each URL fresh
// and read the prerendered tags, so the JSON-LD block is left as prerendered.
export function applyPageMeta(pathname: string): void {
  if (typeof document === 'undefined') return;
  const meta = getPageMeta(pathname);
  const url = absoluteUrl(meta.path);
  const image = absoluteUrl(meta.image.path);

  document.title = meta.title;
  setMetaTag('name', 'description', meta.description);
  setMetaTag('property', 'og:type', meta.ogType);
  setMetaTag('property', 'og:title', meta.title);
  setMetaTag('property', 'og:description', meta.description);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:width', String(meta.image.width));
  setMetaTag('property', 'og:image:height', String(meta.image.height));
  setMetaTag('name', 'twitter:title', meta.title);
  setMetaTag('name', 'twitter:description', meta.description);
  setMetaTag('name', 'twitter:image', image);

  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
  if (meta.noindex) {
    canonical?.remove();
    setMetaTag('name', 'robots', 'noindex, follow');
  } else {
    robots?.remove();
    if (canonical) {
      canonical.href = url;
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = url;
      document.head.appendChild(link);
    }
  }
}
