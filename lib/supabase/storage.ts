import { supabaseAdmin } from './admin-client';

const BUCKET = 'product-images';

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type.split('/').pop();
  return fromType || 'jpg';
}

/** Uploads a product image to Supabase Storage and returns its public URL. */
export async function uploadProductImage(file: File, slug: string): Promise<string> {
  const path = `${slug}-${Date.now()}.${extensionFor(file)}`;
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Best-effort cleanup — only deletes images this app actually hosts, never external URLs (seed data, etc). */
export async function deleteProductImageIfOwned(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = url.slice(index + marker.length);
  await supabaseAdmin.storage.from(BUCKET).remove([path]);
}
