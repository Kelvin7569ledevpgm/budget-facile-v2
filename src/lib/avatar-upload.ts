import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadProfileAvatar(client: SupabaseClient, userId: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error('Image trop volumineuse (max. 2 Mo).');
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Format accepté : JPEG, PNG, WebP ou GIF.');
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  const safeExt = ext && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/avatar.${safeExt}`;

  const { error: upErr } = await client.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (upErr) throw upErr;

  const { data } = client.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
