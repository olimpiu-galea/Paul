/**
 * Recenzii: afișare din data/reviews.json (+ seed în HTML),
 * carusel auto, browse modal cu filtre, form → email (FormSubmit) + fallback mailto.
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
  const browseOpenBtns = document.querySelectorAll("[data-reviews-browse-open]");
  const modal = document.getElementById("review-modal");
  const browseModal = document.getElementById("review-browse-modal");
  const form = document.getElementById("review-form");
  if (!track || !modal || !form) return;

  const cfg = window.SITE_CONFIG || {
    whatsappNumber: "40722452793",
    reviewEmail: "oli.galea95@gmail.com",
  };

  const statusEl = form.querySelector("[data-review-status]");
  const submitBtn = form.querySelector("[data-review-submit]");
  let submitting = false;

  const PER_PAGE = 2;
  let fileReviews = [];
  let reviews = [];
  let pages = [];
  let index = 0;
  let timer = null;
  let reducedMotion = false;
  let browseFilter = "all";
  let browseSort = "newest";
  let browseFocusId = null;

  const FEMALE_NAMES = {
    ana: 1, anita: 1, bianca: 1, catalina: 1, cristina: 1, dana: 1, diana: 1,
    elena: 1, ioana: 1, irina: 1, laura: 1, maria: 1, mihaela: 1, monica: 1,
    oana: 1, roxana: 1, simona: 1, andreea: 1, andreia: 1, alexandra: 1, georgiana: 1,
    iulia: 1, iuli: 1, alina: 1, adriana: 1, gabriela: 1, sofia: 1, teodora: 1, carmen: 1,
  };
  const MALE_NAMES = {
    andrei: 1, adrian: 1, alexandru: 1, bogdan: 1, catalin: 1, ciprian: 1,
    cristian: 1, daniel: 1, eduard: 1, florin: 1, george: 1, ionut: 1, ionuț: 1,
    laviniu: 1, lucian: 1, mihai: 1, mihaita: 1, "mihăiță": 1, mircea: 1,
    miron: 1, nicolae: 1, paul: 1, radu: 1, sergiu: 1, stefan: 1, stefan: 1,
    vlad: 1, goia: 1, luca: 1,
  };

  const AVATAR_MALE =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.4"/>' +
    '<path d="M5.5 19.2c.9-3.4 3.2-5.2 6.5-5.2s5.6 1.8 6.5 5.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
    "</svg>";

  const AVATAR_FEMALE =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="8.2" r="3.1" stroke="currentColor" stroke-width="1.4"/>' +
    '<path d="M8.2 6.2c.7-1.5 2-2.3 3.8-2.3s3.1.8 3.8 2.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>' +
    '<path d="M5.5 19.2c.9-3.4 3.2-5.2 6.5-5.2s5.6 1.8 6.5 5.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
    "</svg>";

  const browseList = browseModal && browseModal.querySelector("[data-browse-list]");
  const browseEmpty = browseModal && browseModal.querySelector("[data-browse-empty]");
  const browseMeta = browseModal && browseModal.querySelector("[data-browse-meta]");
  const browseAvg = browseModal && browseModal.querySelector("[data-browse-avg]");
  const browseScore = browseModal && browseModal.querySelector("[data-browse-score]");
  const browseStars = browseModal && browseModal.querySelector("[data-browse-stars]");
  const browseCount = browseModal && browseModal.querySelector("[data-browse-count]");
  const browseBars = browseModal && browseModal.querySelector("[data-browse-bars]");
  const browseSortEl = browseModal && browseModal.querySelector("[data-browse-sort]");
  const browseRatingEl = browseModal && browseModal.querySelector("[data-browse-rating]");
  const browseScroll = browseModal && browseModal.querySelector(".reviews-browse-scroll");

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

  function anyModalOpen() {
    return (
      !modal.hidden ||
      (browseModal && !browseModal.hidden)
    );
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
      '<div class="review-more-slot">' +
      '<button type="button" class="review-more" data-review-more hidden>Citește mai mult</button>' +
      "</div>" +
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

  function normalizeNameToken(token) {
    return String(token || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "");
  }

  function guessGender(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(normalizeNameToken)
      .filter(Boolean);
    if (!parts.length) return "m";

    for (let i = 0; i < parts.length; i++) {
      if (FEMALE_NAMES[parts[i]]) return "f";
      if (MALE_NAMES[parts[i]]) return "m";
    }

    const first = parts[0];
    if (/a$|ea$|ia$/.test(first) && !MALE_NAMES[first]) return "f";
    return "m";
  }

  function avatarHtml(name) {
    const gender = guessGender(name);
    return (
      '<div class="reviews-browse-avatar reviews-browse-avatar--' +
      gender +
      '" aria-hidden="true">' +
      (gender === "f" ? AVATAR_FEMALE : AVATAR_MALE) +
      "</div>"
    );
  }

  function browseItemHtml(r, focused) {
    const id = escapeHtml(r.id || "");
    const name = r.name || "Client";
    const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
    const ratingLabel = rating.toFixed(1).replace(".", ",");
    return (
      '<article class="reviews-browse-item' +
      (focused ? " is-focus" : "") +
      '" data-browse-id="' +
      id +
      '" id="browse-review-' +
      id +
      '">' +
      '<div class="reviews-browse-author">' +
      avatarHtml(name) +
      '<div class="reviews-browse-author-meta">' +
      '<span class="review-name">' +
      escapeHtml(name) +
      "</span>" +
      (r.date
        ? '<time datetime="' +
          escapeHtml(r.date) +
          '">Recenzie: ' +
          escapeHtml(formatDate(r.date)) +
          "</time>"
        : "") +
      "</div>" +
      "</div>" +
      '<div class="reviews-browse-body">' +
      '<div class="reviews-browse-body-top">' +
      starsHtml(r.rating) +
      '<span class="reviews-browse-rating-badge" aria-label="' +
      rating +
      ' din 5">' +
      escapeHtml(ratingLabel) +
      "</span>" +
      "</div>" +
      '<blockquote class="review-text">' +
      escapeHtml(r.text || "") +
      "</blockquote>" +
      "</div>" +
      "</article>"
    );
  }

  function getFilteredSortedReviews() {
    let list = reviews.slice();
    if (browseFilter !== "all") {
      const rating = Number(browseFilter);
      list = list.filter((r) => Number(r.rating) === rating);
    }
    list.sort((a, b) => {
      if (browseSort === "oldest") {
        return String(a.date || "").localeCompare(String(b.date || ""));
      }
      if (browseSort === "highest") {
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      }
      if (browseSort === "lowest") {
        return (Number(a.rating) || 0) - (Number(b.rating) || 0);
      }
      return String(b.date || "").localeCompare(String(a.date || ""));
    });
    return list;
  }

  function renderBrowseBars() {
    if (!browseBars) return;
    const total = reviews.length || 1;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const n = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0)));
      counts[n] += 1;
    });
    browseBars.innerHTML = [5, 4, 3, 2, 1]
      .map((star) => {
        const count = counts[star];
        const pct = Math.round((count / total) * 100);
        return (
          '<div class="reviews-browse-bar-row">' +
          "<span>" +
          star +
          " ★</span>" +
          '<div class="reviews-browse-bar-track" aria-hidden="true">' +
          '<div class="reviews-browse-bar-fill" style="width:' +
          pct +
          '%"></div>' +
          "</div>" +
          "<strong>" +
          count +
          "</strong>" +
          "</div>"
        );
      })
      .join("");
  }

  function updateBrowseSummary() {
    if (!browseAvg) return;
    if (!reviews.length) {
      browseAvg.hidden = true;
      return;
    }
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = sum / reviews.length;
    const avgRounded = Math.round(avg * 10) / 10;
    const avgLabel = avgRounded.toFixed(1).replace(".", ",");
    if (browseScore) browseScore.textContent = avgLabel;
    if (browseStars) browseStars.innerHTML = starsHtml(avg, { partial: true });
    if (browseCount) {
      const n = reviews.length;
      browseCount.textContent = n === 1 ? "pe baza a 1 recenzie" : "pe baza a " + n + " recenzii";
    }
    renderBrowseBars();
    browseAvg.hidden = false;
  }

  function renderBrowseList() {
    if (!browseModal || !browseList) return;
    updateBrowseSummary();
    const list = getFilteredSortedReviews();

    if (browseMeta) {
      browseMeta.textContent =
        list.length === 1
          ? "1 recenzie afișată"
          : list.length + " recenzii afișate";
    }

    if (!list.length) {
      browseList.innerHTML = "";
      if (browseEmpty) browseEmpty.hidden = false;
      return;
    }

    if (browseEmpty) browseEmpty.hidden = true;
    browseList.innerHTML = list
      .map((r) => browseItemHtml(r, browseFocusId && String(r.id) === String(browseFocusId)))
      .join("");

    if (browseFocusId) {
      const el = browseList.querySelector(
        '[data-browse-id="' + CSS.escape(String(browseFocusId)) + '"]'
      );
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
        });
      }
    }
  }

  function syncBrowseFiltersUi() {
    if (!browseModal) return;
    if (browseRatingEl) browseRatingEl.value = browseFilter;
    if (browseSortEl) browseSortEl.value = browseSort;
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

  function syncTrackHeight() {
    const pages = track.querySelectorAll(".review-page");
    if (!pages.length) {
      track.style.height = "";
      track.style.minHeight = "";
      return;
    }

    let max = 0;
    pages.forEach((page) => {
      max = Math.max(max, page.scrollHeight, page.offsetHeight);
    });

    if (max > 0) {
      const px = Math.ceil(max) + "px";
      track.style.minHeight = px;
      track.style.height = px;
    }
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

    requestAnimationFrame(() => {
      markOverflow();
      syncTrackHeight();
    });
    if (browseModal && !browseModal.hidden) renderBrowseList();
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
    requestAnimationFrame(() => {
      markOverflow();
      syncTrackHeight();
    });
  }

  function next() {
    goTo(index + 1);
  }

  function startTimer() {
    stopTimer();
    if (reducedMotion || pages.length < 2) return;
    if (anyModalOpen()) return;
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

  function openBrowseModal(opts) {
    if (!browseModal) return;
    browseFocusId = opts && opts.focusId ? opts.focusId : null;
    if (browseFocusId) {
      browseFilter = "all";
      browseSort = "newest";
    }
    syncBrowseFiltersUi();
    renderBrowseList();
    browseModal.hidden = false;
    document.body.classList.add("modal-open");
    stopTimer();
    if (browseScroll) browseScroll.scrollTop = 0;
    const closeBtn = browseModal.querySelector(".modal-close");
    if (closeBtn && !browseFocusId) closeBtn.focus();
    else if (browseList) browseList.focus();
  }

  function closeBrowseModal() {
    if (!browseModal) return;
    browseModal.hidden = true;
    browseFocusId = null;
    if (modal.hidden) document.body.classList.remove("modal-open");
    startTimer();
  }

  function openModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    setFormStatus("", null);
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
    if (!browseModal || browseModal.hidden) document.body.classList.remove("modal-open");
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

  function resetBrowseScroll() {
    if (browseScroll) browseScroll.scrollTop = 0;
  }

  openBtns.forEach((btn) => btn.addEventListener("click", openModal));
  browseOpenBtns.forEach((btn) =>
    btn.addEventListener("click", () => openBrowseModal())
  );

  modal.querySelectorAll("[data-review-close]").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  if (browseModal) {
    browseModal.querySelectorAll("[data-reviews-browse-close]").forEach((el) => {
      el.addEventListener("click", closeBrowseModal);
    });

    if (browseRatingEl) {
      browseRatingEl.addEventListener("change", () => {
        browseFilter = browseRatingEl.value || "all";
        browseFocusId = null;
        renderBrowseList();
        resetBrowseScroll();
      });
    }

    if (browseSortEl) {
      browseSortEl.addEventListener("change", () => {
        browseSort = browseSortEl.value || "newest";
        browseFocusId = null;
        renderBrowseList();
        resetBrowseScroll();
      });
    }

    const leaveBtn = browseModal.querySelector("[data-browse-leave-review]");
    if (leaveBtn) {
      leaveBtn.addEventListener("click", () => {
        closeBrowseModal();
        openModal();
      });
    }
  }

  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-review-more]");
    if (!btn) return;
    const card = btn.closest("[data-review-id]");
    if (!card) return;
    const id = card.getAttribute("data-review-id");
    openBrowseModal({ focusId: id });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (browseModal && !browseModal.hidden) closeBrowseModal();
    else if (!modal.hidden) closeModal();
  });

  section.addEventListener("mouseenter", stopTimer);
  section.addEventListener("mouseleave", () => {
    if (!anyModalOpen()) startTimer();
  });
  section.addEventListener("focusin", stopTimer);
  section.addEventListener("focusout", (e) => {
    if (!section.contains(e.relatedTarget)) {
      if (!anyModalOpen()) startTimer();
    }
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(() => {
      markOverflow();
      syncTrackHeight();
    });
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

  function setFormStatus(msg, kind) {
    if (!statusEl) return;
    if (!msg) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.classList.remove("is-ok", "is-err");
      statusEl.removeAttribute("data-mailto");
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-ok", kind === "ok");
    statusEl.classList.toggle("is-err", kind === "err");
  }

  function reviewEmail() {
    return String(cfg.reviewEmail || "oli.galea95@gmail.com").trim();
  }

  function web3Key() {
    return String(cfg.web3formsAccessKey || "").trim();
  }

  function isApiSuccess(data) {
    if (!data) return false;
    return data.success === true || data.success === "true";
  }

  function buildMailto(email, subject, body) {
    return (
      "mailto:" +
      email +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function mailtoHref(payload) {
    const subject = "Recenzie site Paul — " + payload.rating + "/5 — " + payload.name;
    const body = [
      "Nume: " + payload.name,
      "Evaluare: " + payload.stars + " (" + payload.rating + "/5)",
      "Mesaj: " + payload.text,
    ].join("\n");
    return buildMailto(reviewEmail(), subject, body);
  }

  function sendViaWeb3Forms(payload) {
    const key = web3Key();
    if (!key) return Promise.reject(new Error("Lipsește web3formsAccessKey în config.js"));

    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: key,
        subject: "Recenzie site Paul — " + payload.rating + "/5 — " + payload.name,
        from_name: "Paul — site",
        name: payload.name,
        rating: payload.stars + " (" + payload.rating + "/5)",
        message: payload.text,
        page: cfg.siteUrl || "https://www.paulbas.ro",
        botcheck: "",
      }),
    }).then(async (res) => {
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }
      if (!res.ok || !isApiSuccess(data)) {
        throw new Error(
          (data && (data.message || data.error)) ||
            "Web3Forms a răspuns cu eroare (" + res.status + ")."
        );
      }
      return { provider: "web3forms", data: data };
    });
  }

  function sendViaFormSubmit(payload) {
    const email = reviewEmail();
    const endpoint = "https://formsubmit.co/ajax/" + encodeURIComponent(email);
    const body = new FormData();
    body.append("name", payload.name);
    body.append("_subject", "Recenzie site Paul — " + payload.rating + "/5 — " + payload.name);
    body.append("_template", "table");
    body.append("rating", payload.stars + " (" + payload.rating + "/5)");
    body.append("message", payload.text);
    body.append("source", cfg.siteUrl || "https://www.paulbas.ro");

    return fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: body,
    }).then(async (res) => {
      let data = null;
      try {
        data = await res.json();
      } catch (_) {
        data = null;
      }
      if (!res.ok || !isApiSuccess(data)) {
        throw new Error(
          (data && data.message) ||
            "FormSubmit a eșuat (" + res.status + ")."
        );
      }
      return { provider: "formsubmit", data: data };
    });
  }

  function sendReviewEmail(payload) {
    if (web3Key()) return sendViaWeb3Forms(payload);
    return sendViaFormSubmit(payload);
  }

  function showMailtoFallback(payload, reason) {
    const href = mailtoHref(payload);
    setFormStatus(
      (reason ? reason + " " : "") +
        "Poți trimite manual: apasă butonul de mai jos.",
      "err"
    );
    let link = form.querySelector("[data-review-mailto]");
    if (!link) {
      link = document.createElement("a");
      link.className = "btn btn-ghost";
      link.setAttribute("data-review-mailto", "");
      link.style.marginTop = "0.75rem";
      link.style.display = "inline-flex";
      const actions = form.querySelector(".form-actions");
      if (actions) actions.prepend(link);
      else form.appendChild(link);
    }
    link.href = href;
    link.textContent = "Deschide aplicația de email";
    link.hidden = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (submitting) return;

    const nameWrap = form.querySelector('[data-field="review-name"]');
    const textWrap = form.querySelector('[data-field="review-text"]');
    const ratingEl = form.querySelector("#review-rating");
    const mailtoBtn = form.querySelector("[data-review-mailto]");
    if (mailtoBtn) mailtoBtn.hidden = true;

    const name = (nameEl.value || "").trim();
    const text = (textEl.value || "").trim();
    const rating = Math.max(1, Math.min(5, Number(ratingEl && ratingEl.value) || 5));

    if (nameWrap) nameWrap.classList.toggle("has-error", !name);
    if (textWrap) textWrap.classList.toggle("has-error", text.length < 10);
    if (!name || text.length < 10) {
      setFormStatus("Completează numele și un mesaj de cel puțin 10 caractere.", "err");
      return;
    }

    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    const payload = { name: name, rating: rating, text: text, stars: stars };

    submitting = true;
    if (submitBtn) submitBtn.disabled = true;
    setFormStatus(
      web3Key()
        ? "Se trimite pe email…"
        : "Se trimite pe email (FormSubmit)…",
      null
    );

    sendReviewEmail(payload)
      .then(() => {
        setFormStatus("Mulțumim! Emailul a fost acceptat — verifică inboxul.", "ok");
        form.reset();
        const ratingInput = form.querySelector("#review-rating");
        if (ratingInput) ratingInput.value = "5";
        syncStarButtons(5);
        setTimeout(closeModal, 1600);
      })
      .catch((err) => {
        console.warn("Review email failed:", err);
        const hint = !web3Key()
          ? "FormSubmit e nestabil fără activare. Adaugă web3formsAccessKey în config.js. "
          : "";
        showMailtoFallback(payload, hint + (err && err.message ? err.message : "Trimitere eșuată."));
      })
      .finally(() => {
        submitting = false;
        if (submitBtn) submitBtn.disabled = false;
      });
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
