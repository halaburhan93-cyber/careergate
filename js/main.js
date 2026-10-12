/* أدوات مشتركة + الترويسة والتذييل لكل الصفحات */
(function () {
  const CG = (window.CG = {});

  CG.esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  CG.param = (key) => new URLSearchParams(location.search).get(key);

  CG.getJob = (id) => window.CG_JOBS.find((j) => j.id === id) || null;

  CG.formatDate = (iso) => {
    try {
      return new Date(iso + "T00:00:00").toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", {
        day: "numeric", month: "long", year: "numeric",
      });
    } catch { return iso; }
  };

  CG.daysAgo = (iso) => {
    const d = Math.round((Date.now() - new Date(iso + "T00:00:00")) / 86400000);
    if (d <= 0) return "نُشرت اليوم";
    if (d === 1) return "نُشرت أمس";
    if (d === 2) return "نُشرت قبل يومين";
    if (d <= 10) return `نُشرت قبل ${d} أيام`;
    return `نُشرت قبل ${d} يومًا`;
  };

  CG.unique = (field) => [...new Set(window.CG_JOBS.map((j) => j[field]))].sort((a, b) => a.localeCompare(b, "ar"));

  CG.jobCard = (j) => `
    <article class="job-card">
      <div class="job-card__main">
        <p class="job-card__dept">${CG.esc(j.department)}</p>
        <h3 class="job-card__title"><a href="job.html?id=${encodeURIComponent(j.id)}">${CG.esc(j.title)}</a></h3>
        <p class="job-card__summary">${CG.esc(j.summary)}</p>
      </div>
      <ul class="tags" aria-label="معلومات الوظيفة">
        <li class="tag">${icon("pin")}${CG.esc(j.location)}</li>
        <li class="tag">${icon("clock")}${CG.esc(j.type)}</li>
        <li class="tag">${icon("level")}${CG.esc(j.level)}</li>
      </ul>
      <p class="job-card__date">${CG.daysAgo(j.posted)}</p>
    </article>`;

  function icon(name) {
    const p = {
      pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
      clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
      level: '<path d="M5 19V13M12 19V8M19 19V4"/>',
    }[name];
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
  }
  CG.icon = icon;

  /* الترويسة والتذييل */
  const page = document.body.dataset.page || "";
  const links = [
    ["index.html", "الرئيسية", "home"],
    ["index.html#about", "عن الشركة", "about"],
    ["jobs.html", "الوظائف الشاغرة", "jobs"],
  ];

  const logo = `
    <a class="brand" href="index.html" aria-label="CareerGate، الصفحة الرئيسية">
      <svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true">
        <path d="M8 36V18a12 12 0 0 1 24 0v18" fill="none" stroke="currentColor" stroke-width="3.2"/>
        <path d="M15 36V19a5 5 0 0 1 10 0v17" fill="none" stroke="var(--brass)" stroke-width="3.2"/>
      </svg>
      <span class="brand__name">Career<span>Gate</span></span>
    </a>`;

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="demo-bar" role="note">نسخة تجريبية: كل الوظائف والبيانات وهمية، ولا تُرسل الطلبات إلى أي جهة.</div>
    <div class="container site-header__inner">
      ${logo}
      <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">
        <span class="sr-only">القائمة</span><span class="nav-toggle__bars" aria-hidden="true"></span>
      </button>
      <nav id="site-nav" class="site-nav" aria-label="التنقل الرئيسي">
        ${links.map(([h, t, k]) => `<a href="${h}" ${k === page ? 'aria-current="page"' : ""}>${t}</a>`).join("")}
        <a class="btn btn--primary btn--sm" href="apply.html">قدّم طلبك</a>
      </nav>
    </div>`;
  document.body.prepend(header);

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".site-nav");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    nav.classList.toggle("is-open", !open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); nav.classList.remove("is-open"); }
  });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container site-footer__inner">
      <div>
        ${logo}
        <p class="site-footer__about">بوابة التوظيف الرسمية لـ ${CG.esc(window.CG_COMPANY.name)} — شركة افتراضية لأغراض العرض.</p>
      </div>
      <nav aria-label="روابط التذييل" class="site-footer__links">
        <a href="jobs.html">الوظائف الشاغرة</a>
        <a href="index.html#about">عن الشركة</a>
        <a href="apply.html">التقديم العام</a>
      </nav>
      <p class="site-footer__copy">© ${new Date().getFullYear()} CareerGate. مشروع تجريبي ببيانات وهمية.</p>
    </div>`;
  document.body.append(footer);
})();
