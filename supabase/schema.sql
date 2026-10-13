-- CareerGate — قاعدة البيانات ونظام الحسابات على Supabase
-- شغّل هذا الملف مرة واحدة من: Supabase Dashboard → SQL Editor → New query → Run
-- الملف آمن لإعادة التشغيل (لا يحذف بيانات موجودة).

-- ========== 1) ملفات المستخدمين (profiles) ==========
-- كلمات المرور لا تُخزَّن هنا: Supabase Auth يحفظها مشفّرة (bcrypt) في auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- إنشاء ملف تلقائيًا عند تسجيل مستخدم جديد
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ========== 2) الوظائف (منقولة من js/data.js) ==========
-- لا يقرؤها إلا المستخدم المسجّل دخوله.
create table if not exists public.jobs (
  id text primary key,
  title text not null,
  department text not null,
  location text not null,
  type text not null,
  level text not null,
  posted date not null,
  deadline date not null,
  salary text,
  summary text,
  responsibilities jsonb not null default '[]',
  requirements jsonb not null default '[]',
  benefits jsonb not null default '[]'
);
alter table public.jobs enable row level security;

drop policy if exists "jobs: signed-in users can read" on public.jobs;
create policy "jobs: signed-in users can read" on public.jobs
  for select to authenticated using (true);
-- لا توجد سياسة إضافة/تعديل: تُدار الوظائف من لوحة Supabase (Table Editor) فقط.

-- ========== 3) طلبات التوظيف ==========
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reference text not null unique,
  job_id text not null,
  job_title text not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) <= 20),
  qualification text not null,
  major text not null check (char_length(major) <= 120),
  cv_name text,
  cv_size integer,
  submitted_at timestamptz not null default now()
);
alter table public.applications enable row level security;

drop policy if exists "applications: insert own" on public.applications;
create policy "applications: insert own" on public.applications
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "applications: read own" on public.applications;
create policy "applications: read own" on public.applications
  for select to authenticated using ((select auth.uid()) = user_id);

-- ========== 4) بيانات الوظائف الحالية (نفس محتوى data.js السابق) ==========
insert into public.jobs
select * from jsonb_populate_recordset(null::public.jobs, $json$[
  {"id":"CG-101","title":"مهندس برمجيات أول (Back-end)","department":"التقنية","location":"الرياض","type":"دوام كامل","level":"خبرة 5+ سنوات","posted":"2026-10-08","deadline":"2026-11-15","salary":"18,000 – 24,000 ر.س",
   "summary":"تصميم وتطوير الخدمات الخلفية لمنصاتنا الرقمية، وقيادة القرارات التقنية مع فريق صغير من المطورين.",
   "responsibilities":["بناء واجهات برمجية (APIs) قابلة للتوسع وصيانتها.","مراجعة الشيفرة البرمجية وتوجيه المطورين الأحدث خبرة.","تحسين أداء قواعد البيانات ومراقبة الأنظمة في بيئة الإنتاج.","المشاركة في تخطيط المنتج مع فرق التصميم والأعمال."],
   "requirements":["بكالوريوس في علوم الحاسب أو ما يعادله.","خبرة عملية مع Node.js أو Java أو Go.","معرفة جيدة بـ PostgreSQL والخدمات السحابية.","إجادة اللغة الإنجليزية قراءة وكتابة."],
   "benefits":["تأمين طبي فئة أولى للموظف والعائلة","عمل هجين يومين أسبوعيًا","ميزانية تدريب سنوية"]},
  {"id":"CG-102","title":"مصمم تجربة مستخدم (UX/UI)","department":"التقنية","location":"جدة","type":"دوام كامل","level":"خبرة 3+ سنوات","posted":"2026-10-05","deadline":"2026-11-05","salary":"12,000 – 16,000 ر.س",
   "summary":"تحويل احتياجات العملاء إلى تجارب رقمية واضحة وسهلة عبر تطبيقات الجوال والويب.",
   "responsibilities":["إجراء مقابلات المستخدمين واختبارات قابلية الاستخدام.","إعداد النماذج الأولية والتصاميم النهائية في Figma.","بناء مكتبة مكونات التصميم والحفاظ عليها."],
   "requirements":["ملف أعمال يوضح منهجية التصميم من البحث إلى التسليم.","خبرة في تصميم الواجهات العربية (RTL).","قدرة على تقديم الأفكار والدفاع عنها أمام أصحاب القرار."],
   "benefits":["تأمين طبي","أجهزة ومعدات حديثة","مكافأة أداء سنوية"]},
  {"id":"CG-103","title":"محاسب مالي","department":"المالية","location":"الرياض","type":"دوام كامل","level":"خبرة 2+ سنوات","posted":"2026-10-10","deadline":"2026-10-31","salary":"9,000 – 12,000 ر.س",
   "summary":"إدارة القيود اليومية والتسويات البنكية وإعداد التقارير المالية الشهرية.",
   "responsibilities":["تسجيل القيود المحاسبية ومراجعتها.","إعداد التسويات البنكية الشهرية.","المساهمة في إقفال الحسابات وإعداد القوائم المالية.","التنسيق مع المراجع الخارجي."],
   "requirements":["بكالوريوس محاسبة.","معرفة بمعايير IFRS وأنظمة ضريبة القيمة المضافة.","إتقان Excel، والخبرة في SAP ميزة إضافية."],
   "benefits":["تأمين طبي","دعم شهادة SOCPA","بدل سكن ونقل"]},
  {"id":"CG-104","title":"أخصائي موارد بشرية","department":"الموارد البشرية","location":"الدمام","type":"دوام كامل","level":"خبرة 2+ سنوات","posted":"2026-09-28","deadline":"2026-10-30","salary":"8,500 – 11,000 ر.س",
   "summary":"متابعة دورة حياة الموظف من الاستقطاب والتعيين إلى التطوير والاحتفاظ بالمواهب.",
   "responsibilities":["فرز طلبات التوظيف وتنسيق المقابلات.","تنفيذ برامج تهيئة الموظفين الجدد.","تحديث بيانات الموظفين في نظام الموارد البشرية."],
   "requirements":["بكالوريوس في إدارة الموارد البشرية أو إدارة الأعمال.","معرفة بنظام العمل السعودي.","مهارات تواصل عالية."],
   "benefits":["تأمين طبي","إجازة سنوية 30 يومًا","بيئة عمل تعاونية"]},
  {"id":"CG-105","title":"مدير مشاريع","department":"العمليات","location":"الرياض","type":"دوام كامل","level":"خبرة 7+ سنوات","posted":"2026-10-01","deadline":"2026-11-20","salary":"22,000 – 30,000 ر.س",
   "summary":"قيادة مشاريع التحول التشغيلي متعددة الأطراف من التخطيط حتى الإغلاق.",
   "responsibilities":["إعداد خطط المشاريع والميزانيات والجداول الزمنية.","إدارة المخاطر والتواصل مع أصحاب المصلحة.","رفع تقارير الأداء للإدارة التنفيذية."],
   "requirements":["شهادة PMP أو ما يعادلها.","خبرة في إدارة فرق متعددة التخصصات.","خبرة سابقة في قطاع الخدمات أو الاستشارات."],
   "benefits":["تأمين طبي فئة أولى","سيارة شركة","أسهم تحفيزية"]},
  {"id":"CG-106","title":"محلل بيانات","department":"التقنية","location":"عن بعد","type":"عن بعد","level":"خبرة 2+ سنوات","posted":"2026-10-11","deadline":"2026-11-11","salary":"11,000 – 15,000 ر.س",
   "summary":"تحويل البيانات التشغيلية إلى لوحات معلومات وتوصيات تساعد الإدارة على اتخاذ القرار.",
   "responsibilities":["كتابة استعلامات SQL وتنظيف البيانات.","بناء لوحات المعلومات في Power BI.","تقديم التحليلات بلغة واضحة لغير المتخصصين."],
   "requirements":["بكالوريوس في الإحصاء أو علوم البيانات أو تخصص قريب.","إتقان SQL ومعرفة بـ Python.","الإقامة داخل المملكة."],
   "benefits":["عمل عن بعد بالكامل","تأمين طبي","ساعات عمل مرنة"]},
  {"id":"CG-107","title":"ممثل خدمة عملاء","department":"خدمة العملاء","location":"جدة","type":"دوام جزئي","level":"مبتدئ","posted":"2026-10-09","deadline":"2026-10-29","salary":"4,500 – 5,500 ر.س",
   "summary":"الرد على استفسارات العملاء عبر الهاتف والمحادثة وحل مشكلاتهم من أول تواصل.",
   "responsibilities":["استقبال المكالمات والرسائل وتسجيلها في النظام.","متابعة الشكاوى حتى إغلاقها.","رفع الملاحظات المتكررة لفريق الجودة."],
   "requirements":["شهادة الثانوية العامة كحد أدنى.","لباقة في الحديث وصبر في التعامل.","استعداد للعمل بنظام الورديات."],
   "benefits":["تدريب مدفوع","جدول مرن","فرصة للتثبيت بدوام كامل"]},
  {"id":"CG-108","title":"متدرب تسويق رقمي","department":"التسويق","location":"الرياض","type":"تدريب","level":"حديث تخرج","posted":"2026-10-12","deadline":"2026-11-01","salary":"مكافأة شهرية 3,000 ر.س",
   "summary":"برنامج تدريبي مدته 6 أشهر للتعرف على إدارة الحملات الرقمية وقياس نتائجها.",
   "responsibilities":["المساعدة في إعداد محتوى منصات التواصل.","متابعة أداء الحملات الإعلانية وإعداد تقارير أسبوعية.","المشاركة في أبحاث السوق."],
   "requirements":["طالب في سنة التخرج أو حديث تخرج (تسويق، إعلام، إدارة أعمال).","شغف بالمحتوى الرقمي.","معرفة أساسية بأدوات التصميم ميزة إضافية."],
   "benefits":["شهادة إتمام تدريب","إشراف مباشر من مختص","أولوية في التوظيف"]},
  {"id":"CG-109","title":"مهندس أمن سيبراني","department":"التقنية","location":"الرياض","type":"دوام كامل","level":"خبرة 4+ سنوات","posted":"2026-09-25","deadline":"2026-11-25","salary":"17,000 – 23,000 ر.س",
   "summary":"حماية أنظمة المجموعة وبياناتها، والاستجابة للحوادث الأمنية، ورفع وعي الموظفين.",
   "responsibilities":["مراقبة التنبيهات الأمنية وتحليلها.","تنفيذ تقييمات الثغرات بشكل دوري.","تطبيق ضوابط الهيئة الوطنية للأمن السيبراني."],
   "requirements":["بكالوريوس في الأمن السيبراني أو علوم الحاسب.","شهادة احترافية مثل CISSP أو OSCP أو Security+.","خبرة مع أنظمة SIEM."],
   "benefits":["تأمين طبي فئة أولى","دعم الشهادات الاحترافية","بدل مناوبة"]},
  {"id":"CG-110","title":"مسؤول مشتريات","department":"العمليات","location":"الدمام","type":"دوام كامل","level":"خبرة 3+ سنوات","posted":"2026-10-03","deadline":"2026-11-03","salary":"10,000 – 13,000 ر.س",
   "summary":"إدارة عمليات الشراء والتفاوض مع الموردين وضمان الجودة بأفضل تكلفة.",
   "responsibilities":["طلب عروض الأسعار ومقارنتها.","التفاوض على العقود ومتابعة التوريد.","تقييم أداء الموردين بشكل ربع سنوي."],
   "requirements":["بكالوريوس في سلاسل الإمداد أو إدارة الأعمال.","مهارات تفاوض قوية.","خبرة في أنظمة ERP."],
   "benefits":["تأمين طبي","بدل نقل","مكافأة سنوية"]}
]$json$::jsonb)
on conflict (id) do nothing;
