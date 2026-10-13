/* صفحات الحساب: إنشاء حساب، تسجيل الدخول، نسيت كلمة المرور، تعيين كلمة مرور جديدة.
   كل العمليات الحساسة (تشفير كلمة المرور، إرسال البريد، الرموز) تتم على خادم Supabase. */
(function () {
  const AUTH = window.CG_AUTH;
  const sb = AUTH.sb;
  const page = document.body.dataset.page;
  const form = document.getElementById("auth-form");
  const alertBox = document.getElementById("form-alert");
  const notice = document.getElementById("form-notice");
  const btn = document.getElementById("submit-btn");
  const btnText = btn.textContent;
  const next = AUTH.safeNext(CG.param("next"));

  /* إظهار/إخفاء كلمة المرور */
  document.querySelectorAll(".pw__toggle").forEach((t) => t.addEventListener("click", () => {
    const input = document.getElementById(t.getAttribute("aria-controls"));
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    t.textContent = show ? "إخفاء" : "إظهار";
    t.setAttribute("aria-pressed", String(show));
  }));

  /* قواعد التحقق (يُعاد التحقق على الخادم أيضًا) */
  const rules = {
    fullName: (v) => {
      v = v.trim().replace(/\s+/g, " ");
      if (!v) return "أدخل اسمك الكامل.";
      if (v.length < 3 || v.length > 120) return "الاسم يجب أن يكون بين 3 و120 حرفًا.";
      if (!/^[؀-ۿa-zA-Z\s'.-]+$/.test(v)) return "الاسم يجب أن يحتوي على حروف فقط.";
      return "";
    },
    email: (v) => {
      v = v.trim();
      if (!v) return "أدخل بريدك الإلكتروني.";
      return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v) && v.length <= 254 ? "" : "صيغة البريد غير صحيحة، مثال: name@example.com";
    },
    password: (v) => {
      if (!v) return "أدخل كلمة المرور.";
      if (page === "login") return "";
      if (v.length < 8) return "كلمة المرور يجب ألا تقل عن 8 أحرف.";
      if (v.length > 72) return "كلمة المرور يجب ألا تزيد عن 72 حرفًا.";
      if (!/[A-Za-z؀-ۿ]/.test(v) || !/\d/.test(v)) return "يجب أن تحتوي كلمة المرور على حرف ورقم على الأقل.";
      return "";
    },
    password2: (v) => (!v ? "أعد كتابة كلمة المرور." : v !== form.elements.password.value ? "كلمتا المرور غير متطابقتين." : ""),
  };
  const fields = Object.keys(rules).filter((n) => form.elements[n]);

  function validateField(name) {
    const el = form.elements[name];
    const msg = rules[name](el.value || "");
    el.closest(".field").classList.toggle("is-invalid", !!msg);
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    document.getElementById(name + "-error").textContent = msg;
    return !msg;
  }
  fields.forEach((n) => {
    const el = form.elements[n];
    el.addEventListener("blur", () => el.value && validateField(n));
    el.addEventListener("input", () => { if (el.closest(".field").classList.contains("is-invalid")) validateField(n); });
  });

  function showError(msg) {
    notice.classList.remove("is-visible");
    alertBox.textContent = msg;
    alertBox.classList.add("is-visible");
    alertBox.focus();
  }
  function showNotice(msg) {
    alertBox.classList.remove("is-visible");
    notice.textContent = msg;
    notice.classList.add("is-visible");
    notice.focus();
  }
  function busy(on, label) {
    btn.disabled = on;
    btn.textContent = on ? label : btnText;
  }

  // ترجمة أخطاء Supabase إلى رسائل عربية واضحة دون كشف وجود الحسابات
  function friendly(err) {
    const m = String((err && (err.code || err.message)) || "").toLowerCase();
    if (err && err.status === 429 || m.includes("rate") || m.includes("too many")) return "محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
    if (m.includes("invalid_credentials") || m.includes("invalid login")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    if (m.includes("email_not_confirmed") || m.includes("not confirmed")) return "لم يتم تفعيل الحساب بعد. افتح رسالة التفعيل المرسلة إلى بريدك.";
    if (m.includes("weak_password") || m.includes("password should")) return "كلمة المرور ضعيفة. اختر كلمة أطول تحتوي على حروف وأرقام.";
    if (m.includes("same_password") || m.includes("different from the old")) return "كلمة المرور الجديدة يجب أن تختلف عن السابقة.";
    if (m.includes("user_already_exists") || m.includes("already registered")) return "تعذّر إنشاء الحساب بهذا البريد. جرّب تسجيل الدخول أو استعادة كلمة المرور.";
    if (m.includes("fetch") || m.includes("network")) return "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.";
    return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  const handlers = {
    async login() {
      const { error } = await sb.auth.signInWithPassword({
        email: form.email.value.trim(), password: form.password.value,
      });
      if (error) throw error;
      location.replace(next);
    },

    async register() {
      const { data, error } = await sb.auth.signUp({
        email: form.email.value.trim(),
        password: form.password.value,
        options: {
          data: { full_name: form.fullName.value.trim().replace(/\s+/g, " ") },
          emailRedirectTo: AUTH.baseUrl() + "login.html?confirmed=1",
        },
      });
      if (error) throw error;
      if (data.session) return location.replace("index.html"); // إن كان تفعيل البريد معطّلًا
      form.reset();
      form.querySelector(".auth-fields").hidden = true;
      showNotice("تم إنشاء الحساب. أرسلنا رسالة تفعيل إلى بريدك الإلكتروني؛ افتحها واضغط الرابط ثم سجّل الدخول. (إن لم تجدها، تحقّق من مجلد الرسائل غير المرغوبة.)");
    },

    async forgot() {
      const { error } = await sb.auth.resetPasswordForEmail(form.email.value.trim(), {
        redirectTo: AUTH.baseUrl() + "reset.html",
      });
      // نعرض نفس الرسالة دائمًا حتى لا يُكشف إن كان البريد مسجّلًا أم لا
      if (error && (error.status === 429 || /rate/i.test(error.message))) throw error;
      form.querySelector(".auth-fields").hidden = true;
      showNotice("إذا كان هذا البريد مسجّلًا لدينا، فستصلك خلال دقائق رسالة تحتوي على رابط آمن لتعيين كلمة مرور جديدة. الرابط صالح لمدة محدودة ولمرة واحدة.");
    },

    async reset() {
      const { error } = await sb.auth.updateUser({ password: form.password.value });
      if (error) throw error;
      // إنهاء الجلسات الأخرى على الأجهزة الأخرى بعد تغيير كلمة المرور
      await sb.auth.signOut({ scope: "others" }).catch(() => {});
      form.querySelector(".auth-fields").hidden = true;
      showNotice("تم تغيير كلمة المرور بنجاح. جارٍ تحويلك…");
      setTimeout(() => location.replace("index.html"), 1500);
    },
  };

  const busyLabel = { login: "جارٍ الدخول…", register: "جارٍ إنشاء الحساب…", forgot: "جارٍ الإرسال…", reset: "جارٍ الحفظ…" };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const invalid = fields.filter((n) => !validateField(n));
    if (invalid.length) {
      showError(invalid.length === 1 ? "يوجد حقل يحتاج إلى تصحيح." : `توجد ${invalid.length} حقول تحتاج إلى تصحيح.`);
      form.elements[invalid[0]].focus();
      return;
    }
    busy(true, busyLabel[page]);
    try {
      await handlers[page]();
    } catch (err) {
      console.error(err);
      showError(friendly(err));
    } finally {
      busy(false);
    }
  });

  /* حالة الصفحة بعد التحقق من الجلسة */
  AUTH.ready.then((user) => {
    if (page === "reset") {
      // رابط منتهي أو غير صالح: Supabase يعيد الخطأ في جزء الرابط بعد #
      const hash = new URLSearchParams(location.hash.slice(1));
      if (hash.get("error") || !user) {
        form.querySelector(".auth-fields").hidden = true;
        showError("رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا.");
      }
      return;
    }
    if (user && (page === "login" || page === "register")) return location.replace(next);
    if (page === "login" && CG.param("confirmed")) showNotice("تم تفعيل حسابك. يمكنك تسجيل الدخول الآن.");
  });
})();
