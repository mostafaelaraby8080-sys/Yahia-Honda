-- شغّل الملف ده مرة واحدة في Supabase: SQL Editor → New query → Run
-- بيضيف دعم الصور المتعددة وأسماء الألوان من غير ما يمس المنتجات الموجودة.

alter table public.products add column if not exists images text[] not null default '{}';
alter table public.products add column if not exists colors text[] not null default '{}';

-- نقل الصورة القديمة لقائمة الصور للمنتجات الحالية
update public.products
   set images = array[image_url]
 where image_url is not null and coalesce(array_length(images, 1), 0) = 0;
