# Supabase setup

## Run migrations

1. In the [Supabase Dashboard](https://supabase.com/dashboard), open your project → **SQL Editor**.
2. Run the contents of `migrations/20250219000000_users_and_avatars.sql` in order.

If the `INSERT INTO storage.buckets` step fails (some projects manage buckets via the API):

- Go to **Storage** in the Dashboard → **New bucket** → name: `avatars`, set **Public bucket** to ON.
- Optionally upload `components/avatar/default-avatar-2.png` as `default.png` into the bucket for a shared default avatar URL; the app also serves a default from `/avatar/default.png` when the user has no custom avatar.

## Users table

- `public.users` stores only **verified** users (rows are created/updated by the trigger when `auth.users.email_confirmed_at` is set).
- Columns: `id`, `full_name`, `email`, `phone`, `subscription` (default `basic`), `avatar_url`, `created_at`, `updated_at`.
- RLS: users can only read and update their own row.

## Avatars bucket

- Bucket `avatars` is public for read; authenticated users can upload/update/delete only their own file under path `{user_id}/filename`.
