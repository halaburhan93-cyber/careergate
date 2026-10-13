# CareerGate — بوابة توظيف تجريبية

بوابة توظيف لشركة افتراضية (مجموعة الأفق القابضة) مبنية بـ HTML وCSS وJavaScript، مع **نظام حسابات حقيقي** عبر [Supabase](https://supabase.com) (المصادقة + قاعدة بيانات PostgreSQL).
الموقع نفسه يبقى ملفات ثابتة على GitHub Pages، وكل العمليات الحساسة تتم على خادم Supabase.

> ⚠️ الوظائف والشركة وهمية. ملف السيرة الذاتية لا يُرفع (يُحفظ اسمه فقط).

## الصفحات

| الملف | الوصول | المحتوى |
|---|---|---|
| `login.html` | عام | تسجيل الدخول بالبريد وكلمة المرور |
| `register.html` | عام | إنشاء حساب (الاسم، البريد، كلمة المرور) + رسالة تفعيل |
| `forgot.html` | عام | طلب رابط استعادة كلمة المرور بالبريد |
| `reset.html` | عبر رابط البريد | تعيين كلمة مرور جديدة |
| `index.html` | **مسجّل فقط** | الرئيسية |
| `jobs.html` | **مسجّل فقط** | الوظائف: بحث وتصفية وترتيب |
| `job.html?id=CG-101` | **مسجّل فقط** | تفاصيل الوظيفة |
| `apply.html?id=CG-101` | **مسجّل فقط** | نموذج التقديم (يُحفظ في قاعدة البيانات) |

## هيكل المشروع

```
careergate/
├── index.html  jobs.html  job.html  apply.html        ← صفحات محمية
├── login.html  register.html  forgot.html  reset.html ← صفحات الحساب
├── css/style.css
├── supabase/schema.sql   ← الجداول + سياسات الحماية (RLS) + بيانات الوظائف
└── js/
    ├── config.js      ← رابط مشروع Supabase والمفتاح العام (فقط)
    ├── guard.js       ← يخفي الصفحة المحمية ويحوّل فورًا إن لا توجد جلسة
    ├── auth.js        ← الجلسة، الحماية، تحميل الوظائف، تسجيل الخروج
    ├── auth-pages.js  ← منطق صفحات الدخول والتسجيل والاستعادة
    ├── data.js        ← بيانات الشركة العامة
    ├── main.js        ← الترويسة (اسم المستخدم + خروج) والتذييل
    ├── jobs.js  job.js  apply.js
```

## كيف تعمل الحماية

- **كلمات المرور:** لا تمر عبر كودنا إلى أي تخزين؛ Supabase Auth يشفّرها بـ bcrypt.
- **الجلسات:** رمز JWT قصير العمر يتجدد تلقائيًا (Refresh Token Rotation)، ويُتحقق منه على الخادم (`getUser`) عند فتح كل صفحة.
- **البيانات محمية فعليًا وليس شكليًا:** الوظائف نُقلت من `data.js` إلى جدول `jobs`، وسياسات RLS لا تسمح بقراءتها إلا لمستخدم مسجّل. كل مستخدم يرى طلباته فقط.
- **الاستعادة:** رابط لمرة واحدة ومحدود المدة يرسله Supabase، ورسالة «نسيت كلمة المرور» لا تكشف إن كان البريد مسجّلًا.
- **حماية إضافية:** حد لمحاولات الدخول (Rate limiting من Supabase)، منع إعادة التوجيه لروابط خارجية، إنهاء الجلسات الأخرى بعد تغيير كلمة المرور.
- **المفاتيح:** الواجهة تحتوي فقط المفتاح العام (publishable/anon) المصمم للمتصفح. **المفتاح السري (secret/service_role) وكلمة مرور SMTP لا يوضعان أبدًا في الكود**؛ يبقيان في لوحة Supabase.

---

## الإعداد (مرة واحدة)

### 1) إنشاء مشروع Supabase
1. سجّل في supabase.com ← **New project** (اختر منطقة قريبة، مثل Frankfurt أو Mumbai).
2. **SQL Editor → New query** ← الصق محتوى `supabase/schema.sql` ← **Run**.
   يُنشئ الجداول والسياسات ويضيف الوظائف العشر الحالية.
3. **Project Settings → API Keys** ← انسخ **Project URL** و**Publishable key** (أو `anon public`) وضعهما في `js/config.js`.

### 2) إعدادات المصادقة
من **Authentication**:
- **Sign In / Providers → Email:** تأكد أن Email مفعّل، وأن **Confirm email** مفعّل.
- **Password requirements (في نفس الصفحة):** الحد الأدنى `8`، ويُفضّل «Letters and digits».
- **URL Configuration:**
  - **Site URL:** `https://USERNAME.github.io/careergate/`
  - **Redirect URLs:** أضف:
    - `https://USERNAME.github.io/careergate/**`
    - `http://localhost:8000/**` (للاختبار المحلي)

### 3) إعداد البريد الإلكتروني (ضروري لرسائل حقيقية)
بريد Supabase المدمج **للتجربة فقط**: يرسل لأعضاء فريق المشروع فقط وبعدد قليل جدًا في الساعة. لإرسال رسائل لأي مستخدم استخدم SMTP خاصًا:

**الخيار المقترح: Resend (مجاني حتى 3,000 رسالة/شهر)**
1. سجّل في resend.com ← **Domains → Add domain** ← أضف سجلات DNS المطلوبة لنطاقك (يلزم نطاق تملكه).
2. **API Keys → Create** وانسخ المفتاح.
3. في Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   | الحقل | القيمة |
   |---|---|
   | Sender email | `no-reply@yourdomain.com` |
   | Sender name | `CareerGate` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | مفتاح Resend |

**بدائل:** Brevo أو SendGrid أو Amazon SES (نفس الحقول بقيم مزودك). أو Gmail (`smtp.gmail.com`، منفذ `465`، واسم المستخدم بريدك، وكلمة المرور «App Password» من إعدادات أمان Google بعد تفعيل التحقق بخطوتين) — مناسب للاختبار فقط.

> كلمة مرور SMTP تُحفظ في لوحة Supabase فقط، ولا تظهر في كود الموقع.

4. **(ضروري) Authentication → Emails → Templates:** الروابط يجب أن تفتح صفحات الموقع مع `token_hash`،
   ولا يُستهلك الرمز إلا عند ضغط المستخدم الزر (يمنع خطأ `otp_expired` الذي تسببه برامج فحص الروابط في البريد).

   **Confirm signup:**
   ```html
   <h2>تفعيل حسابك في CareerGate</h2>
   <p>اضغط الرابط التالي ثم زر «تأكيد البريد» لتفعيل حسابك:</p>
   <p><a href="https://halaburhan93-cyber.github.io/careergate/confirm.html?token_hash={{ .TokenHash }}&type=email">تفعيل الحساب</a></p>
   ```
   **Reset Password:**
   ```html
   <h2>استعادة كلمة المرور</h2>
   <p>اضغط الرابط التالي لتعيين كلمة مرور جديدة لحسابك في CareerGate:</p>
   <p><a href="https://halaburhan93-cyber.github.io/careergate/reset.html?token_hash={{ .TokenHash }}&type=recovery">تعيين كلمة المرور</a></p>
   <p>إذا لم تطلب ذلك فتجاهل هذه الرسالة.</p>
   ```
5. بعد تفعيل SMTP ارفع حد الإرسال من **Authentication → Rate Limits** حسب حاجتك.

---

## التشغيل محليًا

صفحات الحساب تحتاج خادمًا (لا تعمل بفتح الملف مباشرة). من مجلد المشروع:

```bash
python -m http.server 8000
```
أو `npx serve -l 8000`، أو إضافة **Live Server** في VS Code (غيّر المنفذ إلى 8000 أو أضف منفذها إلى Redirect URLs). ثم افتح `http://localhost:8000`.

## الاختبار

1. افتح `http://localhost:8000/jobs.html` ← يجب أن تُحوَّل إلى صفحة الدخول.
2. **إنشاء حساب** ببريد حقيقي ← تصلك رسالة تفعيل ← اضغطها ← تعود لصفحة الدخول برسالة «تم تفعيل حسابك».
3. **الدخول** ← تظهر الوظائف، واسمك وزر «تسجيل الخروج» في الترويسة.
4. **قدّم طلبًا** ← تحقّق من ظهوره في Supabase: **Table Editor → applications**.
5. **سجّل الخروج** ← حاول فتح `jobs.html` ← تُحوَّل للدخول.
6. **نسيت كلمة المرور** ← تصلك رسالة ← افتح الرابط ← عيّن كلمة جديدة ← تدخل تلقائيًا. افتح نفس الرابط مرة ثانية ← يجب أن يظهر «الرابط غير صالح».
7. جرّب كلمة مرور خاطئة عدة مرات ← رسالة عامة دون كشف التفاصيل.
8. المستخدمون: **Authentication → Users**؛ ملفاتهم: جدول `profiles`.

## النشر على نفس الرابط (GitHub Pages)

الموقع منشور أصلًا من فرع `main`، فيكفي رفع التعديلات إلى المستودع نفسه:

```bash
git add .
git commit -m "Add user accounts and authentication"
git push
```
(أو من واجهة GitHub: **Add file → Upload files** وارفع الملفات والمجلدات الجديدة والمعدّلة.)

بعد دقيقة أو اثنتين يتحدث الموقع على نفس الرابط `https://USERNAME.github.io/careergate/`. تأكد أن هذا الرابط مضاف في **Site URL** و**Redirect URLs** في Supabase.

ملف `.nojekyll` موجود لمنع GitHub من معالجة الملفات بـ Jekyll.

## إدارة الوظائف

الوظائف الآن في جدول `jobs` على Supabase: **Table Editor → jobs** لإضافة وظيفة أو تعديلها (حقول `responsibilities` و`requirements` و`benefits` مصفوفات JSON). خيارات التصفية تُبنى تلقائيًا.

## البيانات السابقة

- الوظائف العشر من `data.js` السابق نُقلت كما هي إلى الجدول عبر `schema.sql`.
- الطلبات القديمة المحفوظة في متصفح المستخدم (`localStorage`) تُنقل تلقائيًا إلى حسابه في قاعدة البيانات عند أول تسجيل دخول من نفس المتصفح.
