/* نظام الحسابات: الاتصال بـ Supabase، التحقق من الجلسة، حماية الصفحات الداخلية، تسجيل الخروج.
   الصفحات العامة (الدخول/التسجيل/الاستعادة) تحمل data-auth="public" في <body>،
   وكل صفحة أخرى تتطلب جلسة صالحة. */
(function () {
  const cfg = window.CG_CONFIG || {};
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
  });
  const isPublic = document.body.dataset.auth === "public";
  const AUTH = (window.CG_AUTH = { sb, user: null });

  // يسمح فقط بإعادة التوجيه إلى صفحات الموقع نفسه (يمنع Open Redirect)
  AUTH.safeNext = (n) => (n && /^(index|jobs|job|apply)\.html(\?[^#\s]*)?$/.test(n) ? n : "index.html");
  AUTH.baseUrl = () => new URL(".", location.href).href;
  AUTH.displayName = (u) => (u && ((u.user_metadata || {}).full_name || u.email)) || "";

  function goLogin() {
    const here = location.pathname.split("/").pop() + location.search;
    location.replace("login.html?next=" + encodeURIComponent(here || "index.html"));
  }

  AUTH.signOut = async () => {
    try { await sb.auth.signOut(); } finally { location.replace("login.html"); }
  };

  // تسجيل الخروج من تبويب آخر أو انتهاء الجلسة ← العودة لصفحة الدخول
  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && !isPublic) goLogin();
  });

  // نقل الطلبات القديمة المحفوظة في المتصفح (النسخة السابقة) إلى قاعدة البيانات مرة واحدة
  async function migrateLocalApplications() {
    let old;
    try { old = JSON.parse(localStorage.getItem("cg_applications") || "[]"); } catch { return; }
    if (!Array.isArray(old) || !old.length) return;
    const rows = old.filter((r) => r && r.reference).map((r) => ({
      reference: r.reference, job_id: r.jobId, job_title: r.jobTitle, full_name: r.fullName, email: r.email,
      phone: r.phone, qualification: r.qualification, major: r.major, cv_name: r.cvName, cv_size: r.cvSize,
      submitted_at: r.submittedAt,
    }));
    const { error } = await sb.from("applications").upsert(rows, { onConflict: "reference", ignoreDuplicates: true });
    if (!error) localStorage.removeItem("cg_applications");
  }

  AUTH.ready = (async () => {
    // getUser يتحقق من الرمز مقابل الخادم (لا يكتفي بالنسخة المحفوظة محليًا)
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      const { data, error } = await sb.auth.getUser();
      AUTH.user = error ? null : data.user;
    }
    if (!isPublic) {
      if (!AUTH.user) { goLogin(); return new Promise(() => {}); } // لا تُكمل الصفحة
      const { data: jobs, error } = await sb.from("jobs").select("*");
      if (error) throw error;
      window.CG_JOBS = jobs;
      migrateLocalApplications().catch(() => {});
    }
    document.documentElement.classList.remove("auth-pending");
    return AUTH.user;
  })();

  AUTH.ready.catch((err) => {
    console.error(err);
    document.documentElement.classList.remove("auth-pending");
    document.body.innerHTML = `<main class="auth"><div class="auth-card"><h1>تعذّر الاتصال</h1>
      <p>تحقق من اتصالك بالإنترنت ثم أعد تحميل الصفحة.</p>
      <button class="btn btn--primary btn--block" onclick="location.reload()">إعادة المحاولة</button></div></main>`;
  });
})();
