/* صفحة تفاصيل الوظيفة: job.html?id=CG-101 */
(function () {
  const root = document.getElementById("job-root");
  const id = CG.param("id");
  const job = id && CG.getJob(id);

  if (!job) {
    document.title = "الوظيفة غير موجودة | CareerGate";
    root.innerHTML = `
      <section class="page-head"><div class="container">
        <nav class="breadcrumb" aria-label="مسار التنقل"><a href="index.html">الرئيسية</a><span>/</span><a href="jobs.html">الوظائف</a></nav>
        <h1>الوظيفة غير موجودة</h1>
        <p>ربما أُغلق التقديم على هذه الوظيفة أو أن الرابط غير صحيح.</p>
      </div></section>
      <div class="container" style="padding-block:3rem"><a class="btn btn--primary" href="jobs.html">تصفح الوظائف المتاحة</a></div>`;
    return;
  }

  document.title = `${job.title} | CareerGate`;
  const li = (arr) => arr.map((x) => `<li>${CG.esc(x)}</li>`).join("");
  const applyHref = `apply.html?id=${encodeURIComponent(job.id)}`;
  const related = window.CG_JOBS.filter((j) => j.id !== job.id && j.department === job.department).slice(0, 3);

  root.innerHTML = `
    <section class="page-head">
      <div class="container">
        <nav class="breadcrumb" aria-label="مسار التنقل">
          <a href="index.html">الرئيسية</a><span>/</span><a href="jobs.html">الوظائف</a><span>/</span>${CG.esc(job.department)}
        </nav>
        <h1>${CG.esc(job.title)}</h1>
        <p>${CG.esc(job.summary)}</p>
        <ul class="tags">
          <li class="tag">${CG.icon("pin")}${CG.esc(job.location)}</li>
          <li class="tag">${CG.icon("clock")}${CG.esc(job.type)}</li>
          <li class="tag">${CG.icon("level")}${CG.esc(job.level)}</li>
        </ul>
      </div>
    </section>

    <div class="container detail-layout">
      <article class="detail-body">
        <h2>المهام والمسؤوليات</h2><ul>${li(job.responsibilities)}</ul>
        <h2>المتطلبات</h2><ul>${li(job.requirements)}</ul>
        <h2>المزايا</h2><ul>${li(job.benefits)}</ul>
      </article>

      <aside class="aside-card" aria-label="ملخص الوظيفة">
        <dl class="meta-list">
          <div><dt>رقم الوظيفة</dt><dd dir="ltr">${CG.esc(job.id)}</dd></div>
          <div><dt>القسم</dt><dd>${CG.esc(job.department)}</dd></div>
          <div><dt>الراتب التقديري</dt><dd>${CG.esc(job.salary)}</dd></div>
          <div><dt>تاريخ النشر</dt><dd>${CG.formatDate(job.posted)}</dd></div>
          <div><dt>آخر موعد للتقديم</dt><dd>${CG.formatDate(job.deadline)}</dd></div>
        </dl>
        <a class="btn btn--primary btn--block" href="${applyHref}" id="apply-btn">قدّم على هذه الوظيفة</a>
        <button class="btn btn--ghost btn--block" type="button" id="share-btn">نسخ رابط الوظيفة</button>
      </aside>
    </div>

    ${related.length ? `
    <section class="container related" style="padding-bottom:4rem" aria-labelledby="rel-title">
      <h2 id="rel-title">وظائف أخرى في قسم ${CG.esc(job.department)}</h2>
      <div class="job-list">${related.map(CG.jobCard).join("")}</div>
    </section>` : ""}`;

  const toast = document.getElementById("toast");
  const show = (msg) => { toast.textContent = msg; toast.classList.add("is-visible"); setTimeout(() => toast.classList.remove("is-visible"), 2200); };

  document.getElementById("share-btn").addEventListener("click", async () => {
    try {
      if (navigator.share && matchMedia("(max-width: 760px)").matches) {
        await navigator.share({ title: job.title, url: location.href });
      } else {
        await navigator.clipboard.writeText(location.href);
        show("تم نسخ رابط الوظيفة");
      }
    } catch { show("تعذّر النسخ، انسخ الرابط من شريط العنوان"); }
  });
})();
