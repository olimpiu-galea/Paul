/**
 * Cookie banner — doar preferință locală (esențial).
 * Cheie: SITE_CONFIG.cookieConsentKey
 */
(function () {
  const cfg = window.SITE_CONFIG || {};
  const key = cfg.cookieConsentKey || "paul_cookie_consent_v1";
  const banner = document.getElementById("cookie-banner");
  if (!banner) return;

  function saved() {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function save(value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }

  function open() {
    banner.hidden = false;
    banner.classList.add("is-open");
  }

  function close() {
    banner.classList.remove("is-open");
    banner.hidden = true;
  }

  if (!saved()) open();

  banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => {
    save("accepted");
    close();
  });

  banner.querySelector("[data-cookie-essential]")?.addEventListener("click", () => {
    save("essential");
    close();
  });
})();
