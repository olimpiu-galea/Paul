/**
 * Recenzii: afișare din data/reviews.json (+ seed în HTML),
 * carusel auto, modal → WhatsApp (ca formularul de contact).
 */
(function () {
  const INTERVAL_MS = 4000;
  const REVIEWS_URL = "data/reviews.json";

  const section = document.querySelector("[data-reviews]");
  if (!section) return;

  const track = section.querySelector("[data-reviews-track]");
  const dots = section.querySelector("[data-reviews-dots]");
  const avgBox = section.querySelector("[data-reviews-avg]");
  const avgScoreEl = section.querySelector("[data-avg-score]");
  const avgStarsEl = section.querySelector("[data-avg-stars]");
  const avgCountEl = section.querySelector("[data-avg-count]");
  const openBtns = document.querySelectorAll("[data-review-open]");
  const modal = document.getElementById("review-modal");
  const form = document.getElementById("review-form");
  if (!track || !modal || !form) return;

  const cfg = window.SITE_CONFIG || {
    whatsappNumber: "40722452793",
  };

  const PER_PAGE = 2;
  let fileReviews = [];
  let reviews = [];
  let pages = [];
  let index = 0;
  let timer = null;
  let reducedMotion = false;

  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {}

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function starsHtml(rating, opts) {
    const partial = !!(opts && opts.partial);
    const n = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(n);
    const frac = n - full;
    let html =
      '<span class="review-stars" aria-label="' +
      (Math.round(n * 10) / 10) +
      ' din 5 stele">';
    for (let i = 1; i <= 5; i++) {
      let cls = "";
      if (i <= full) cls = "is-on";
      else if (partial && i === full + 1 && frac >= 0.25) cls = frac >= 0.75 ? "is-on" : "is-half";
      html += '<span class="' + cls + '" aria-hidden="true">★</span>';
    }
    html += "</span>";
    return html;
  }

  function updateAverage() {
    if (!avgBox) return;
    if (!reviews.length) {
      avgBox.hidden = true;
      return;
    }

    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = sum / reviews.length;
    const avgRounded = Math.round(avg * 10) / 10;
    const avgLabel = avgRounded.toFixed(1).replace(".", ",");

    if (avgScoreEl) avgScoreEl.textContent = avgLabel;
    if (avgStarsEl) avgStarsEl.innerHTML = starsHtml(avg, { partial: true });
    if (avgCountEl) {
      const n = reviews.length;
      avgCountEl.textContent =
        n === 1 ? "1 recenzie" : "din " + n + " recenzii";
    }
    avgBox.hidden = false;
    avgBox.setAttribute(
      "aria-label",
      "Media evaluărilor: " + avgLabel + " din 5, pe baza a " + reviews.length + " recenzii"
    );
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function reviewCardHtml(r) {
    const id = escapeHtml(r.id || "");
    return (
      '<article class="review-card" data-review-id="' +
      id +
      '">' +
      starsHtml(r.rating) +
      '<blockquote class="review-text is-clamped">' +
      escapeHtml(r.text || "") +
      "</blockquote>" +
      '<button type="button" class="review-more" data-review-more hidden>Citește mai mult</button>' +
      '<footer class="review-meta">' +
      '<span class="review-name">' +
      escapeHtml(r.name || "Client") +
      "</span>" +
      (r.date
        ? '<time datetime="' +
          escapeHtml(r.date) +
          '">' +
          escapeHtml(formatDate(r.date)) +
          "</time>"
        : "") +
      "</footer>" +
      "</article>"
    );
  }

  function markOverflow() {
    track.querySelectorAll(".review-card").forEach((card) => {
      const textEl = card.querySelector(".review-text");
      const moreBtn = card.querySelector("[data-review-more]");
      if (!textEl || !moreBtn) return;
      const overflows = textEl.scrollHeight > textEl.clientHeight + 1;
      moreBtn.hidden = !overflows;
    });
  }

  function buildPages() {
    pages = [];
    for (let i = 0; i < reviews.length; i += PER_PAGE) {
      pages.push(reviews.slice(i, i + PER_PAGE));
    }
  }

  function render() {
    updateAverage();

    if (!reviews.length) {
      track.innerHTML = '<p class="reviews-empty">Fii primul care lasă o recenzie.</p>';
      if (dots) dots.innerHTML = "";
      return;
    }

    buildPages();
    if (index >= pages.length) index = 0;

    track.innerHTML = pages
      .map((page, i) => {
        return (
          '<div class="review-page' +
          (i === index ? " is-active" : "") +
          '" aria-hidden="' +
          (i === index ? "false" : "true") +
          '">' +
          page.map(reviewCardHtml).join("") +
          "</div>"
        );
      })
      .join("");

    if (dots) {
      dots.innerHTML = pages
        .map(
          (_, i) =>
            '<button type="button" class="review-dot' +
            (i === index ? " is-active" : "") +
            '" aria-label="Pagina ' +
            (i + 1) +
            '" data-review-goto="' +
            i +
            '"></button>'
        )
        .join("");
    }

    requestAnimationFrame(markOverflow);
  }

  function goTo(i) {
    if (!pages.length) return;
    index = ((i % pages.length) + pages.length) % pages.length;
    track.querySelectorAll(".review-page").forEach((el, j) => {
      const on = j === index;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-hidden", on ? "false" : "true");
    });
    if (dots) {
      dots.querySelectorAll(".review-dot").forEach((el, j) => {
        el.classList.toggle("is-active", j === index);
      });
    }
    requestAnimationFrame(markOverflow);
  }

  function next() {
    goTo(index + 1);
  }

  function startTimer() {
    stopTimer();
    if (reducedMotion || pages.length < 2) return;
    if (!modal.hidden || (viewModal && !viewModal.hidden)) return;
    timer = window.setInterval(next, INTERVAL_MS);
  }

  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function refresh() {
    reviews = fileReviews.slice().sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );
    buildPages();
    if (index >= pages.length) index = 0;
    render();
    startTimer();
  }

  const viewModal = document.getElementById("review-view-modal");
  const viewStars = viewModal && viewModal.querySelector("[data-view-stars]");
  const viewText = viewModal && viewModal.querySelector("[data-view-text]");
  const viewName = viewModal && viewModal.querySelector("[data-view-name]");
  const viewDate = viewModal && viewModal.querySelector("[data-view-date]");

  function openViewModal(review) {
    if (!viewModal || !review) return;
    if (viewStars) viewStars.innerHTML = starsHtml(review.rating);
    if (viewText) viewText.textContent = review.text || "";
    if (viewName) viewName.textContent = review.name || "Client";
    if (viewDate) {
      if (review.date) {
        viewDate.dateTime = review.date;
        viewDate.textContent = formatDate(review.date);
        viewDate.hidden = false;
      } else {
        viewDate.textContent = "";
        viewDate.hidden = true;
      }
    }
    viewModal.hidden = false;
    document.body.classList.add("modal-open");
    stopTimer();
    const closeBtn = viewModal.querySelector("[data-review-view-close]");
    if (closeBtn) closeBtn.focus();
  }

  function closeViewModal() {
    if (!viewModal) return;
    viewModal.hidden = true;
    if (modal.hidden) document.body.classList.remove("modal-open");
    startTimer();
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const first = form.querySelector("#review-name");
    if (first) first.focus();
    stopTimer();
  }

  function closeModal() {
    modal.hidden = true;
    form.reset();
    form.querySelectorAll(".has-error").forEach((el) => el.classList.remove("has-error"));
    const ratingInput = form.querySelector("#review-rating");
    if (ratingInput) ratingInput.value = "5";
    syncStarButtons(5);
    if (!viewModal || viewModal.hidden) document.body.classList.remove("modal-open");
    startTimer();
  }

  function syncStarButtons(value) {
    form.querySelectorAll("[data-star]").forEach((btn) => {
      const v = Number(btn.getAttribute("data-star"));
      btn.classList.toggle("is-on", v <= value);
      btn.setAttribute("aria-checked", v === value ? "true" : "false");
    });
  }

  function readSeedFromDom() {
    const el = document.getElementById("reviews-seed");
    if (!el) return [];
    try {
      const data = JSON.parse(el.textContent || "{}");
      return data && Array.isArray(data.reviews) ? data.reviews : [];
    } catch (_) {
      return [];
    }
  }

  openBtns.forEach((btn) => btn.addEventListener("click", openModal));

  modal.querySelectorAll("[data-review-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  if (viewModal) {
    viewModal.querySelectorAll("[data-review-view-close]").forEach((el) => {
      el.addEventListener("click", closeViewModal);
    });
  }

  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-review-more]");
    if (!btn) return;
    const card = btn.closest("[data-review-id]");
    if (!card) return;
    const id = card.getAttribute("data-review-id");
    const review = reviews.find((r) => String(r.id) === String(id));
    if (review) openViewModal(review);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (viewModal && !viewModal.hidden) closeViewModal();
    else if (!modal.hidden) closeModal();
  });

  section.addEventListener("mouseenter", stopTimer);
  section.addEventListener("mouseleave", () => {
    if (modal.hidden && (!viewModal || viewModal.hidden)) startTimer();
  });
  section.addEventListener("focusin", stopTimer);
  section.addEventListener("focusout", (e) => {
    if (!section.contains(e.relatedTarget)) {
      if (modal.hidden && (!viewModal || viewModal.hidden)) startTimer();
    }
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(markOverflow);
  });

  if (dots) {
    dots.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-review-goto]");
      if (!btn) return;
      goTo(Number(btn.getAttribute("data-review-goto")));
      startTimer();
    });
  }

  form.querySelectorAll("[data-star]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = Number(btn.getAttribute("data-star"));
      const input = form.querySelector("#review-rating");
      if (input) input.value = String(v);
      syncStarButtons(v);
    });
  });
  syncStarButtons(5);

  const nameEl = form.querySelector("#review-name");
  const textEl = form.querySelector("#review-text");
  if (nameEl) {
    nameEl.addEventListener("input", () => {
      const wrap = form.querySelector('[data-field="review-name"]');
      if (wrap) wrap.classList.remove("has-error");
    });
  }
  if (textEl) {
    textEl.addEventListener("input", () => {
      const wrap = form.querySelector('[data-field="review-text"]');
      if (wrap) wrap.classList.remove("has-error");
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameWrap = form.querySelector('[data-field="review-name"]');
    const textWrap = form.querySelector('[data-field="review-text"]');
    const ratingEl = form.querySelector("#review-rating");

    const name = (nameEl.value || "").trim();
    const text = (textEl.value || "").trim();
    const rating = Math.max(1, Math.min(5, Number(ratingEl && ratingEl.value) || 5));

    if (nameWrap) nameWrap.classList.toggle("has-error", !name);
    if (textWrap) textWrap.classList.toggle("has-error", text.length < 10);
    if (!name || text.length < 10) return;

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const message = [
      "Bună ziua,",
      "Am lăsat o recenzie pe site:",
      `Nume: ${name}`,
      `Evaluare: ${stars} (${rating}/5)`,
      `Mesaj: ${text}`,
    ].join("\n");

    const url = `https://wa.me/${cfg.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    closeModal();
  });

  fileReviews = readSeedFromDom();
  refresh();

  fetch(REVIEWS_URL)
    .then((res) => {
      if (!res.ok) throw new Error("reviews fetch failed");
      return res.json();
    })
    .then((data) => {
      const list = data && Array.isArray(data.reviews) ? data.reviews : [];
      if (list.length) {
        fileReviews = list;
        refresh();
      }
    })
    .catch(() => {
      /* seed din DOM — normal pe file:// */
    });
})();
