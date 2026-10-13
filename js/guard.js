/* فحص سريع في <head>: يخفي الصفحة حتى يتأكد auth.js من الجلسة،
   ويحوّل فورًا إلى صفحة الدخول إن لم توجد جلسة محفوظة أصلًا (لتجنب وميض المحتوى).
   التحقق الحقيقي من صلاحية الجلسة يتم في auth.js مقابل خادم Supabase. */
(function () {
  document.documentElement.classList.add("auth-pending");
  try {
    const ref = new URL(window.CG_CONFIG.supabaseUrl).hostname.split(".")[0];
    if (!localStorage.getItem(`sb-${ref}-auth-token`)) {
      const here = location.pathname.split("/").pop() + location.search;
      location.replace("login.html?next=" + encodeURIComponent(here));
    }
  } catch { /* يكمل auth.js التحقق */ }
})();
