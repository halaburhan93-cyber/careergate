/* نموذج التقديم: تحقق من الحقول، رفع الملف، رقم مرجعي، رسالة تأكيد
   ملاحظة مهمة: لا يوجد خادم هنا. الإرسال محاكى، والحفظ في localStorage للعرض فقط.
   للإرسال الفعلي استبدل الدالة submitApplication بطلب إلى خدمة خلفية (انظر README). */
(function () {
  const form = document.getElementById("apply-form");
  const $job = document.getElementById("job");
  const $cv = document.getElementById("cv");
  const dz = document.getElementById("dropzone");
  const chip = document.getElementById("file-chip");
  const alertBox = document.getElementById("form-alert");
  const MAX_MB = 5;
  const ALLOWED = ["pdf", "doc", "docx"];

  /* قائمة الوظائف */
  $job.innerHTML =
    `<option value="">اختر الوظيفة</option><option value="GENERAL">طلب عام (بدون وظيفة محددة)</option>` +
    window.CG_JOBS.map((j) => `<option value="${CG.esc(j.id)}">${CG.esc(j.title)} — ${CG.esc(j.location)}</option>`).join("");
  const pre = CG.param("id");
  if (pre && CG.getJob(pre)) {
    $job.value = pre;
    document.getElementById("apply-title").textContent = "التقديم على: " + CG.getJob(pre).title;
  }

  /* أدوات */
  const toLatinDigits = (s) => s.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
  const normPhone = (s) => toLatinDigits(s).replace(/[\s\-()]/g, "");
  const ext = (name) => (name.split(".").pop() || "").toLowerCase();
  const fmtSize = (b) => (b < 1024 * 1024 ? (b / 1024).toFixed(0) + " KB" : (b / 1024 / 1024).toFixed(1) + " MB");

  /* قواعد التحقق — كل قاعدة تعيد رسالة خطأ أو "" */
  const rules = {
    job: (v) => (v ? "" : "اختر الوظيفة التي تتقدم لها، أو اختر «طلب عام»."),
    fullName: (v) => {
      v = v.trim().replace(/\s+/g, " ");
      if (!v) return "أدخل اسمك الكامل.";
      if (!/^[\u0600-\u06FFa-zA-Z\s'.-]+$/.test(v)) return "الاسم يجب أن يحتوي على حروف فقط.";
      if (v.split(" ").length < 2) return "أدخل الاسم الأول واسم العائلة على الأقل.";
      return "";
    },
    email: (v) => {
      v = v.trim();
      if (!v) return "أدخل بريدك الإلكتروني.";
      return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v) ? "" : "صيغة البريد غير صحيحة، مثال: name@example.com";
    },
    phone: (v) => {
      v = normPhone(v);
      if (!v) return "أدخل رقم جوالك.";
      if (/^05\d{8}$/.test(v) || /^(\+|00)9665\d{8}$/.test(v) || /^\+\d{8,15}$/.test(v)) return "";
      return "رقم الجوال غير صحيح. يبدأ الرقم السعودي بـ 05 ويتكون من 10 أرقام.";
    },
    qualification: (v) => (v ? "" : "اختر مؤهلك العلمي."),
    major: (v) => (v.trim().length >= 2 ? "" : "أدخل تخصصك."),
    cv: () => {
      const f = $cv.files[0];
      if (!f) return "ارفع سيرتك الذاتية.";
      if (!ALLOWED.includes(ext(f.name))) return "صيغة الملف غير مدعومة. ارفع ملف PDF أو Word.";
      if (f.size === 0) return "الملف فارغ. اختر ملفًا آخر.";
      if (f.size > MAX_MB * 1024 * 1024) return `حجم الملف ${fmtSize(f.size)}، والحد الأقصى ${MAX_MB} ميجابايت.`;
      return "";
    },
    consent: () => (document.getElementById("consent").checked ? "" : "يجب الموافقة على الإقرار قبل الإرسال."),
  };

  function validateField(name) {
    const el = form.elements[name];
    const msg = rules[name](el.value || "");
    const field = el.closest(".field");
    field.classList.toggle("is-invalid", !!msg);
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    document.getElementById(name + "-error").textContent = msg;
    return !msg;
  }

  // التحقق عند مغادرة الحقل، ثم أثناء الكتابة بعد ظهور الخطأ
  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    if (name === "cv") return;
    el.addEventListener("blur", () => validateField(name));
    el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", () => {
      if (el.closest(".field").classList.contains("is-invalid")) validateField(name);
    });
  });

  /* رفع الملف + السحب والإفلات */
  function updateFile() {
    const f = $cv.files[0];
    if (f) {
      document.getElementById("file-name").textContent = `${f.name} (${fmtSize(f.size)})`;
      chip.classList.add("is-visible");
      dz.hidden = true;
    } else {
      chip.classList.remove("is-visible");
      dz.hidden = false;
    }
    validateField("cv");
  }
  $cv.addEventListener("change", updateFile);
  document.getElementById("file-remove").addEventListener("click", () => {
    $cv.value = "";
    updateFile();
    $cv.focus();
  });
  ["dragenter", "dragover"].forEach((e) => dz.addEventListener(e, (ev) => { ev.preventDefault(); dz.classList.add("is-drag"); }));
  ["dragleave", "drop"].forEach((e) => dz.addEventListener(e, () => dz.classList.remove("is-drag")));
  dz.addEventListener("drop", (ev) => {
    ev.preventDefault();
    if (ev.dataTransfer.files.length) {
      const dt = new DataTransfer();
      dt.items.add(ev.dataTransfer.files[0]);
      $cv.files = dt.files;
      updateFile();
    }
  });

  /* الرقم المرجعي: CG-YYMMDD-XXXXX (حروف وأرقام دون الحروف المتشابهة) */
  function makeReference() {
    const d = new Date();
    const date = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const rnd = new Uint32Array(5);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(rnd) : rnd.forEach((_, i) => (rnd[i] = Math.random() * 1e9));
    return `CG-${date}-${[...rnd].map((n) => chars[n % chars.length]).join("")}`;
  }

  /* محاكاة الإرسال — هنا يُستبدل الكود بطلب fetch إلى الخادم */
  function submitApplication(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const record = { ...data, reference: makeReference(), submittedAt: new Date().toISOString() };
        try {
          const all = JSON.parse(localStorage.getItem("cg_applications") || "[]");
          all.push(record);
          localStorage.setItem("cg_applications", JSON.stringify(all));
        } catch { /* التخزين غير متاح — لا يؤثر على العرض */ }
        resolve(record);
      }, 900);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const invalid = Object.keys(rules).filter((n) => !validateField(n));
    if (invalid.length) {
      alertBox.textContent = invalid.length === 1 ? "يوجد حقل يحتاج إلى تصحيح." : `توجد ${invalid.length} حقول تحتاج إلى تصحيح.`;
      alertBox.classList.add("is-visible");
      const first = form.elements[invalid[0]];
      first.focus({ preventScroll: true });
      first.closest(".field").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    alertBox.classList.remove("is-visible");

    const btn = document.getElementById("submit-btn");
    btn.disabled = true;
    btn.textContent = "جارٍ إرسال الطلب…";

    const f = $cv.files[0];
    const job = CG.getJob($job.value);
    const rec = await submitApplication({
      jobId: $job.value,
      jobTitle: job ? job.title : "طلب عام",
      fullName: form.fullName.value.trim().replace(/\s+/g, " "),
      email: form.email.value.trim(),
      phone: normPhone(form.phone.value),
      qualification: form.qualification.value,
      major: form.major.value.trim(),
      cvName: f.name,
      cvSize: f.size,
    });
    showConfirmation(rec);
  });

  function showConfirmation(r) {
    const card = document.getElementById("form-card");
    const when = new Date(r.submittedAt).toLocaleString("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "long", timeStyle: "short" });
    card.innerHTML = `
      <div class="confirm" role="status" aria-live="polite" tabindex="-1" id="confirm">
        <div class="confirm__seal"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
        <h2>تم استلام طلبك بنجاح</h2>
        <p>شكرًا ${CG.esc(r.fullName.split(" ")[0])}. احتفظ بالرقم المرجعي التالي لمتابعة طلبك:</p>
        <div class="confirm__ref">
          <code id="ref-code">${CG.esc(r.reference)}</code>
          <button type="button" class="link-btn" id="copy-ref">نسخ</button>
        </div>
        <dl class="meta-list summary">
          <div><dt>الوظيفة</dt><dd>${CG.esc(r.jobTitle)}</dd></div>
          <div><dt>البريد الإلكتروني</dt><dd dir="ltr">${CG.esc(r.email)}</dd></div>
          <div><dt>رقم الجوال</dt><dd dir="ltr">${CG.esc(r.phone)}</dd></div>
          <div><dt>المؤهل والتخصص</dt><dd>${CG.esc(r.qualification)} — ${CG.esc(r.major)}</dd></div>
          <div><dt>السيرة الذاتية</dt><dd dir="ltr">${CG.esc(r.cvName)}</dd></div>
          <div><dt>تاريخ التقديم</dt><dd>${when}</dd></div>
        </dl>
        <div class="confirm__actions">
          <a class="btn btn--primary" href="jobs.html">تصفح وظائف أخرى</a>
          <button class="btn btn--ghost" type="button" onclick="window.print()">طباعة التأكيد</button>
        </div>
        <p class="confirm__note">نسخة تجريبية: لم يُرسل هذا الطلب إلى أي جهة، ولم يُرفع الملف إلى خادم. حُفظت البيانات في متصفحك فقط للعرض.</p>
      </div>`;
    document.getElementById("apply-title").textContent = "تم إرسال الطلب";
    document.getElementById("apply-sub").textContent = "رقمك المرجعي ظاهر أدناه. احتفظ به لمتابعة طلبك.";
    document.getElementById("notes").hidden = true;
    const c = document.getElementById("confirm");
    requestAnimationFrame(() => c.classList.add("is-in"));
    c.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("copy-ref").addEventListener("click", async (ev) => {
      try { await navigator.clipboard.writeText(r.reference); ev.target.textContent = "تم النسخ"; }
      catch { ev.target.textContent = "انسخه يدويًا"; }
    });
  }
})();
