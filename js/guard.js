/* فحص سريع في <head>: يخفي الصفحة حتى يتأكد auth.js من الجلسة،
   ويحوّل فورًا إلى صفحة الدخول إن لم توجد جلسة محفوظة أصلًا (لتجنب وميض المحتوى).
   التحقق الحقيقي من صلاحية الجلسة يتم في auth.js مقابل خادم Supabase. */
(function () {
  document.documentElement.classList.add("auth-pending");
  // رابط استعادة كلمة المرور قد يعود إلى أي صفحة (مثلًا Site URL) — نوجّهه لصفحة التعيين مع الرمز كاملًا
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get("type") === "recovery" || h.get("error_code")) {
    location.replace("reset.html" + location.hash);
    return;
  }
  if (h.get("access_token")) return; // جلسة قادمة من رابط بريد — يعالجها auth.js
  try {
    const ref = new URL(window.CG_CONFIG.supabaseUrl).hostname.split(".")[0];
    if (!localStorage.getItem(`sb-${ref}-auth-token`)) {
      const here = location.pathname.split("/").pop() + location.search;
      location.replace("login.html?next=" + encodeURIComponent(here));
    }
  } catch { /* يكمل auth.js التحقق */ }
})();
