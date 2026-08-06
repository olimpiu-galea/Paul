/**
 * Formular → WhatsApp, navigare, animații.
 * Config: ../config.js (SITE_CONFIG)
 */
(function () {
  const cfg = window.SITE_CONFIG || {
    whatsappNumber: "40722452793",
    whatsappUrl: "https://wa.me/40722452793",
    phoneDisplay: "+40 722 452 793",
  };

  document.querySelectorAll("[data-wa-link]").forEach((el) => {
    el.setAttribute("href", cfg.whatsappUrl);
  });
  document.querySelectorAll("[data-phone-display]").forEach((el) => {
    el.textContent = cfg.phoneDisplay;
  });

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        nav.querySelectorAll("a").forEach((link) => link.classList.remove("is-active"));
        a.classList.add("is-active");
      });
    });
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealItems.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  const form = document.getElementById("whatsapp-form");
  if (!form) return;

  const fields = {
    name: form.querySelector("#name"),
    phone: form.querySelector("#phone"),
    service: form.querySelector("#service"),
    message: form.querySelector("#message"),
  };

  function setError(key, on) {
    const wrap = form.querySelector(`[data-field="${key}"]`);
    if (wrap) wrap.classList.toggle("has-error", !!on);
  }

  function validPhone(value) {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  }

  fields.name.addEventListener("input", () => setError("name", false));
  fields.phone.addEventListener("input", () => setError("phone", false));
  fields.service.addEventListener("change", () => setError("service", false));
  fields.message.addEventListener("input", () => setError("message", false));

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (fields.name.value || "").trim();
    const phone = (fields.phone.value || "").trim();
    const serviceValue = fields.service.value || "";
    const serviceLabel = (
      fields.service.options[fields.service.selectedIndex]?.textContent || ""
    ).trim();
    const message = (fields.message.value || "").trim();

    setError("name", !name);
    setError("phone", !validPhone(phone));
    setError("service", !serviceValue);
    setError("message", !message);
    if (!name || !validPhone(phone) || !serviceValue || !message) return;

    const text = [
      "Bună ziua,",
      `Nume: ${name}`,
      `Telefon: ${phone}`,
      `Serviciu: ${serviceLabel}`,
      `Mesaj: ${message}`,
    ].join("\n");

    const url = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });
})();
