# Paul — Site de prezentare

Site one-page (static) pentru asigurări (RCA, CASCO, călătorie, locuință) și diagnoză auto mobilă OBD.
Limbă publică: **română**. Fără backend / API.

## Design activ

**04 — Luxury Charcoal**
- Culori: charcoal `#070707` + aur `#d4af6a` / `#e8c98a`
- Fonturi: Playfair Display (titluri) + Montserrat (corp)
- Portret hero: `assets/paul-breakout.png`
- Variabile CSS: `css/styles.css` → `:root`

## Structură (unde modifici)

| Fișier | Rol |
|--------|-----|
| `CONTENT.md` | Copy RO — sursă de adevăr pentru texte |
| `config.js` | Telefon, WhatsApp, brand — sursă de adevăr contact |
| `llms.txt` | Rezumat + FAQ complex pentru crawleri / asistenți AI |
| `index.html` | Structură pagină + JSON-LD |
| `css/styles.css` | Stiluri (`:root` pentru brand) |
| `js/main.js` | Nav, reveal, formular → WhatsApp |
| `js/reviews.js` | Carusel recenzii + modal → WhatsApp |
| `js/cookies.js` | Banner cookies (localStorage) |
| `data/reviews.json` | Recenzii afișate (și seed în `index.html`) |
| `assets/paul-breakout.png` | Poză hero |
| `politica-confidentialitate.html` | GDPR |
| `politica-cookies.html` | Cookies |
| `robots.txt` / `sitemap.xml` | SEO |

## Contact WhatsApp

- Afișat: `+40 722 452 793`
- wa.me: `https://wa.me/40722452793`
- Formular: `index.html` + `js/main.js` → deschide WhatsApp (fără server)

## Cum modifici rapid

1. **Text** → `CONTENT.md`, apoi același text în `index.html` (+ `llms.txt` dacă e rezumat).
2. **Telefon** → doar `config.js` (și verifică JSON-LD / meta dacă e nevoie).
3. **Poză hero** → `assets/paul-breakout.png` (aceeași denumire).
4. **Culori / fonturi** → `:root` în `css/styles.css`.
5. **Cookies** → `js/cookies.js` + `politica-cookies.html`.
6. **Recenzii** → editează `data/reviews.json` (+ seed din `index.html` `#reviews-seed`). Modalul trimite pe WhatsApp; ca să apară pe site, adaugă recenzia în JSON și redeploy.
7. **Domeniu live** → canonic: `https://www.paulbas.ro` (`sitemap.xml`, `robots.txt`, `index.html`, `config.js`).

## Secțiuni pagină (`index.html`)

| ID | Conținut |
|----|----------|
| `#top` | Hero |
| `#recenzii` | Carusel recenzii + buton modal |
| `#despre` | Despre |
| `#servicii` | Portofoliu servicii |
| `#cum-functioneaza` | Pași |
| `#contact` | Formular WhatsApp |

## Deploy

### Vercel (recomandat)
1. Push pe GitHub / GitLab / Bitbucket.
2. În [vercel.com](https://vercel.com): **Add New Project** → importă repo-ul.
3. Framework Preset: **Other** (site static, fără build).
4. Root Directory: `.` — Deploy.
5. Domeniu canonic: `https://www.paulbas.ro` (și `paulbas.ro` pe același proiect Vercel).

Hosting static alternativ: Netlify, GitHub Pages, cPanel. Deschide `index.html` local pentru preview.
