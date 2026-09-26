// Business details used by page metadata and structured data (data/seo.ts).
// __SITE_URL__ is injected by vite.config.ts: the project's production domain on
// Vercel, or https://alma-ads.co.il when building anywhere else.
declare const __SITE_URL__: string;

export const SITE_URL: string = __SITE_URL__;

export const BRAND_NAME = 'עלמה?';
export const BRAND_CATEGORY = 'צמיחה ופיתוח עסקי';
export const PHONE_DISPLAY = '055-7294068';
export const PHONE_INTERNATIONAL = '+972-55-729-4068';
export const EMAIL = 'niv@alma-ads.co.il';
export const STREET_ADDRESS = 'הגיא 25';
export const CITY = 'יקנעם עילית';
export const FOUNDER_NAME = 'ניב עיני';
export const FOUNDING_YEAR = '2018';
export const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=100064074121688';

// Share image for pages without their own (1200x630, cropped from about-alma.png).
export const DEFAULT_OG_IMAGE = { path: '/images/og-default.jpg', width: 1200, height: 630 };

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`;
