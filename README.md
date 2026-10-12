# CareerGate — بوابة توظيف تجريبية

بوابة توظيف لشركة افتراضية (مجموعة الأفق القابضة) مبنية بـ HTML وCSS وJavaScript فقط، بدون أي مكتبات أو أدوات بناء.

> ⚠️ **مشروع تجريبي ببيانات وهمية.** الوظائف والشركة غير حقيقية، والطلبات **لا تُرسل إلى أي جهة**. عند الضغط على «إرسال الطلب» تُحاكى العملية ويُحفظ الطلب في `localStorage` داخل متصفح المستخدم فقط، ولا يُرفع ملف السيرة الذاتية إلى أي خادم.

## الصفحات

| الملف | المحتوى |
|---|---|
| `index.html` | الرئيسية: بحث سريع، عن الشركة، أحدث الوظائف، مراحل التوظيف |
| `jobs.html` | الوظائف الشاغرة: بحث نصي، تصفية بالقسم والمدينة ونوع الدوام، ترتيب |
| `job.html?id=CG-101` | تفاصيل الوظيفة: المهام والمتطلبات والمزايا وزر التقديم |
| `apply.html?id=CG-101` | نموذج التقديم مع التحقق ورفع السيرة الذاتية ورسالة التأكيد والرقم المرجعي |

## هيكل المشروع

```
careergate/
├── index.html  jobs.html  job.html  apply.html
├── css/style.css
└── js/
    ├── data.js    ← بيانات الوظائف الوهمية (عدّلها هنا)
    ├── main.js    ← الترويسة والتذييل والأدوات المشتركة
    ├── jobs.js    ← البحث والتصفية
    ├── job.js     ← صفحة التفاصيل
    └── apply.js   ← النموذج والتحقق والرقم المرجعي
```

## التشغيل محليًا

**أسهل طريقة:** افتح `index.html` مباشرة في المتصفح بالنقر المزدوج.

**الطريقة الأفضل (خادم محلي):**
```bash
cd careergate
python3 -m http.server 8000
# ثم افتح http://localhost:8000
```
أو استخدم إضافة **Live Server** في VS Code.

## النشر على GitHub Pages

1. أنشئ مستودعًا جديدًا على GitHub (مثلًا `careergate`) واجعله **Public**.
2. ارفع الملفات بحيث يكون `index.html` في **جذر المستودع**:
   ```bash
   cd careergate
   git init
   git add .
   git commit -m "CareerGate initial version"
   git branch -M main
   git remote add origin https://github.com/USERNAME/careergate.git
   git push -u origin main
   ```
   (أو من واجهة GitHub: **Add file → Upload files** واسحب محتويات المجلد.)
3. من المستودع: **Settings → Pages**.
4. في **Build and deployment** اختر **Source: Deploy from a branch**، ثم الفرع `main` والمجلد `/ (root)` واضغط **Save**.
5. بعد دقيقة أو اثنتين سيظهر الرابط: `https://USERNAME.github.io/careergate/`

ملف `.nojekyll` موجود لمنع GitHub من معالجة الملفات بـ Jekyll.

## تخصيص الوظائف

كل الوظائف في `js/data.js`. لإضافة وظيفة انسخ أي عنصر وغيّر `id` (يجب أن يكون فريدًا) وباقي الحقول. خيارات التصفية تُبنى تلقائيًا من البيانات.

## لتحويله إلى نظام حقيقي

GitHub Pages يستضيف ملفات ثابتة فقط، فلا يستطيع استقبال الطلبات أو حفظ الملفات. لاستقبال الطلبات فعليًا تحتاج إلى خدمة خلفية وقاعدة بيانات، مثلًا:

- **خادم خاص** (Node.js/Express، Laravel، Django…) مع قاعدة بيانات (PostgreSQL أو MySQL) وتخزين للملفات (مثل S3).
- **خدمات جاهزة بدون خادم:** Supabase أو Firebase (قاعدة بيانات + تخزين ملفات)، أو خدمات النماذج مثل Formspree وBasin لاستقبال الطلبات على البريد.

نقطة الربط في الكود هي الدالة `submitApplication` في `js/apply.js`. استبدلها بطلب حقيقي، مثال:

```js
async function submitApplication(data) {
  const body = new FormData();
  Object.entries(data).forEach(([k, v]) => body.append(k, v));
  body.append("cv", document.getElementById("cv").files[0]);
  const res = await fetch("https://your-api.example.com/applications", { method: "POST", body });
  if (!res.ok) throw new Error("فشل الإرسال");
  return res.json(); // يُفضّل أن يولّد الخادم الرقم المرجعي ويعيده
}
```

في النظام الحقيقي يجب أيضًا: التحقق من البيانات وفحص الملفات على الخادم (وليس في المتصفح فقط)، استخدام HTTPS، حماية من الرسائل المزعجة (CAPTCHA)، الالتزام بنظام حماية البيانات الشخصية، وإرسال بريد تأكيد للمتقدم، وإضافة لوحة تحكم للموارد البشرية لاستعراض الطلبات.
