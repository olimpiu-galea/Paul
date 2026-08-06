/**
 * Configurație site — editează aici datele de contact / brand.
 * Folosit de js/main.js. Documentat în AGENTS.md și llms.txt.
 *
 * După deploy: setează siteUrl la domeniul real (inclusiv https, fără slash final).
 */
window.SITE_CONFIG = {
  brand: "Paul",
  tagline: "Asigurări & diagnoză auto",
  phoneDisplay: "+40 722 452 793",
  /** Doar cifre, cu prefix țară, fără + — pentru wa.me */
  whatsappNumber: "40722452793",
  whatsappUrl: "https://wa.me/40722452793",
  /** Înlocuiește după publicare — folosit ca referință; actualizează și sitemap/canonical */
  siteUrl: "https://YOUR-DOMAIN.ro",
  locale: "ro-RO",
  cookieConsentKey: "paul_cookie_consent_v1",
};
