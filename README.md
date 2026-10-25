# موقع Yahia Honda

موقع ثابت (HTML/CSS/JS) — مفيش build ولا npm.

## 1) النشر على Vercel (يشتغل فورًا)

1. ادخل vercel.com ← Add New ← Project.
2. ارفع الفولدر ده (أو ادفعه على GitHub واربطه). Framework Preset: **Other**، من غير Build Command.
3. Deploy. الموقع شغال: واتساب، اتصال مباشر، فيسبوك، الأقسام، ودخول الإدارة.
   ![alt text](<WhatsApp Image 2026-10-23 at 1.31.37 PM.jpeg>)
   في الوضع ده (من غير Supabase) المنتجات بتتحفظ في متصفح اللي بيضيف بس. كلمة المرور التجريبية `admin2323`.

## 2) عشان الزباين يشوفوا المنتجات اللي بتضيفها (Supabase — مجاني)

1. supabase.com ← New project.
2. SQL Editor ← الصق محتوى `supabase-setup.sql` ← Run.
3. Authentication ← Users ← Add user: الإيميل `admin@yahiahonda.com` وكلمة المرور `admin2323` (أو أقوى)، وعلّم **Auto Confirm User**.
4. Authentication ← Sign In / Providers ← عطّل **Allow new users to sign up**.
5. Project Settings ← API: انسخ Project URL و anon/publishable key في `config.js`.
6. ارفع الموقع تاني على Vercel (Redeploy).

بعد كده «دخول الإدارة» بكلمة المرور بتفتح لوحة إضافة/حذف المنتجات ورفع الصور من الموبايل أو اللابتوب، والزباين يشوفوا التغيير فورًا.
كلمة المرور في وضع Supabase مش مكتوبة في الكود — بتتغير من Supabase نفسه. غيّرها لحاجة أقوى قبل الإطلاق.


## تحديث: صور متعددة + تعديل المنتجات

لو الموقع شغال على Supabase بالفعل: افتح SQL Editor وشغّل ملف `supabase-update.sql` **مرة واحدة** (متشغّلش `supabase-setup.sql` تاني). بعدها ارفع الموقع على Vercel.

- كل منتج ممكن يتضاف له لحد 8 صور، وكل صورة ليها اسم لون اختياري.
- زرار «تعديل» جنب كل منتج في لوحة الإدارة: تغيّر القسم والسعر والمخزون والصور.
- القسم لازم يتختار (مفيش قسم افتراضي).
- أقسام جديدة: حامل موبايل، تيل سحب، سيور.
