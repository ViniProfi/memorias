/* =========================================================
   script.js — Interatividade do site
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 1. Barra de progresso de leitura ---------- */
  const progressBar = document.getElementById("progressBar");

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + "%";
  }

  /* ---------- 2. Navbar com fundo ao rolar ---------- */
  const navbar = document.getElementById("navbar");
  const toTop = document.getElementById("toTop");

  function onScrollUI() {
    const y = window.scrollY;
    if (navbar) navbar.classList.toggle("is-scrolled", y > 40);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    updateProgress();
  }

  window.addEventListener("scroll", onScrollUI, { passive: true });
  window.addEventListener("resize", updateProgress);

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 3. Animação de entrada (reveal) ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- 4. Contadores animados do hero ---------- */
  const stats = document.querySelectorAll("#heroStats strong[data-count]");

  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  if ("IntersectionObserver" in window && stats.length) {
    const statsObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach(function (s) { statsObserver.observe(s); });
  } else {
    stats.forEach(function (s) { s.textContent = s.dataset.count; });
  }

  /* ---------- 5. Renderização do portfólio ---------- */
  const grid = document.getElementById("redacoesGrid");
  const cards = [];

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildCards() {
    if (!grid || typeof redacoes === "undefined") return;

    redacoes.forEach(function (r, index) {
      const card = document.createElement("article");
      card.className = "redacao-card reveal";
      card.dataset.index = index;
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Abrir redação: " + r.tema);

      // O título do card é o Tema da redação
      card.innerHTML =
        '<div class="rc-top">' +
          '<span class="rc-num">' + String(index + 1).padStart(2, "0") + "</span>" +
        "</div>" +
        '<h3 class="rc-title">' + escapeHTML(r.tema) + "</h3>" +
        '<span class="rc-more">Ler redação <span aria-hidden="true">→</span></span>';

      card.addEventListener("click", function () { openModal(index); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(index);
        }
      });

      grid.appendChild(card);
      cards.push(card);
    });

    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
      cards.forEach(function (c) { obs.observe(c); });
    } else {
      cards.forEach(function (c) { c.classList.add("is-visible"); });
    }
  }

  /* ---------- 6. Modal de leitura ---------- */
  const modal = document.getElementById("modal");
  const modalTitulo = document.getElementById("modalTitulo");
  const modalConteudo = document.getElementById("modalConteudo");
  let lastFocused = null;

  function openModal(index) {
    const r = redacoes[index];
    if (!r || !modal) return;

    lastFocused = document.activeElement;
    
    // Usa o Tema como título do Modal
    modalTitulo.textContent = r.tema; 

    modalConteudo.innerHTML = r.conteudo
      .map(function (p) { return "<p>" + escapeHTML(p) + "</p>"; })
      .join("");

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const closeBtn = modal.querySelector(".modal-close");
    if (closeBtn) closeBtn.focus();
    modal.querySelector(".modal-panel").scrollTop = 0;
  }

  function closeModal() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  if (modal) {
    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
      if (e.key === "Tab" && modal.classList.contains("is-open")) {
        const focusables = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } 
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  buildCards();
  onScrollUI();
})();
