/* صفحة الوظائف: بحث نصي + تصفية متعددة + ترتيب، مع حفظ الحالة في الرابط */
window.CG_AUTH.ready.then(function () {
  const jobs = window.CG_JOBS;
  const groups = ["department", "location", "type"];
  const urlKey = { department: "dept", location: "city", type: "type" };
  const $q = document.getElementById("q");
  const $sort = document.getElementById("sort");
  const $list = document.getElementById("job-list");
  const $count = document.getElementById("results-count");

  // تطبيع النص العربي ليصبح البحث أكثر تسامحًا (أ/إ/آ → ا، ة → ه، ى → ي، إزالة التشكيل)
  const norm = (s) => String(s).toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

  // بناء خيارات التصفية مع عدد الوظائف لكل خيار
  groups.forEach((g) => {
    const box = document.querySelector(`[data-group="${g}"]`);
    box.innerHTML = CG.unique(g).map((v, i) => {
      const n = jobs.filter((j) => j[g] === v).length;
      const id = `${g}-${i}`;
      return `<label class="check" for="${id}"><input type="checkbox" id="${id}" value="${CG.esc(v)}" data-g="${g}"> ${CG.esc(v)} <small>${n}</small></label>`;
    }).join("");
  });

  // قراءة الحالة من الرابط (يدعم الروابط من الصفحة الرئيسية)
  const params = new URLSearchParams(location.search);
  $q.value = params.get("q") || "";
  $sort.value = params.get("sort") || "new";
  groups.forEach((g) => {
    const vals = params.getAll(urlKey[g]);
    document.querySelectorAll(`input[data-g="${g}"]`).forEach((cb) => { cb.checked = vals.includes(cb.value); });
  });

  function selected(g) {
    return [...document.querySelectorAll(`input[data-g="${g}"]:checked`)].map((cb) => cb.value);
  }

  function render() {
    const q = norm($q.value.trim());
    const sel = Object.fromEntries(groups.map((g) => [g, selected(g)]));
    let res = jobs.filter((j) => {
      const hay = norm([j.id, j.title, j.department, j.location, j.summary, ...j.requirements].join(" "));
      const textOk = !q || q.split(/\s+/).every((w) => hay.includes(w));
      return textOk && groups.every((g) => !sel[g].length || sel[g].includes(j[g]));
    });
    const sorters = {
      new: (a, b) => b.posted.localeCompare(a.posted),
      old: (a, b) => a.posted.localeCompare(b.posted),
      deadline: (a, b) => a.deadline.localeCompare(b.deadline),
      az: (a, b) => a.title.localeCompare(b.title, "ar"),
    };
    res.sort(sorters[$sort.value] || sorters.new);

    $count.textContent = res.length
      ? `${res.length} ${res.length === 1 ? "وظيفة" : res.length === 2 ? "وظيفتان" : res.length <= 10 ? "وظائف" : "وظيفة"} من أصل ${jobs.length}`
      : "";
    $list.innerHTML = res.length
      ? res.map(CG.jobCard).join("")
      : `<div class="empty"><h3>لا توجد وظائف تطابق بحثك</h3><p>جرّب كلمة أعم أو أزل بعض عوامل التصفية.</p><button class="btn btn--primary" type="button" id="reset-empty">إعادة ضبط البحث</button></div>`;
    const reset = document.getElementById("reset-empty");
    if (reset) reset.addEventListener("click", clearAll);

    // تحديث الرابط دون إعادة تحميل حتى يمكن مشاركة نتيجة البحث
    const p = new URLSearchParams();
    if ($q.value.trim()) p.set("q", $q.value.trim());
    groups.forEach((g) => sel[g].forEach((v) => p.append(urlKey[g], v)));
    if ($sort.value !== "new") p.set("sort", $sort.value);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
  }

  function clearAll() {
    $q.value = "";
    document.querySelectorAll(".filters input").forEach((cb) => (cb.checked = false));
    render();
  }

  let t;
  $q.addEventListener("input", () => { clearTimeout(t); t = setTimeout(render, 150); });
  $sort.addEventListener("change", render);
  document.getElementById("filters").addEventListener("change", render);
  document.getElementById("clear-filters").addEventListener("click", clearAll);

  const ft = document.getElementById("filters-toggle");
  ft.addEventListener("click", () => {
    const open = ft.getAttribute("aria-expanded") === "true";
    ft.setAttribute("aria-expanded", String(!open));
    document.getElementById("filters").classList.toggle("is-open", !open);
  });

  render();
});
