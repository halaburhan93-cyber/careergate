/* بيانات الشركة العامة.
   بيانات الوظائف نُقلت إلى جدول jobs في Supabase (supabase/schema.sql)
   ولا تُحمَّل إلا بعد تسجيل الدخول، في window.CG_JOBS عبر js/auth.js. */
window.CG_COMPANY = {
  name: "مجموعة الأفق القابضة",
  founded: 2009,
  employees: "1,400+",
  offices: 6,
  email: "careers@example.com",
};
