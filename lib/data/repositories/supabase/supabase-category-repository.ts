import { supabaseAdmin } from '@/lib/supabase/admin-client';
import type { Category } from '@/lib/types/category';
import type { CategoryRepository } from '../category-repository';

interface CategoryRow {
  id: string;
  slug: string;
  type: 'vegetables' | 'fruits';
  name_en: string;
  name_ar: string;
  parent_id: string | null;
  image_url: string | null;
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    name: { en: row.name_en, ar: row.name_ar },
    parentId: row.parent_id,
    imageUrl: row.image_url ?? undefined,
  };
}

export const supabaseCategoryRepository: CategoryRepository = {
  async list() {
    const { data, error } = await supabaseAdmin.from('categories').select('*');
    if (error) throw error;
    return (data as CategoryRow[]).map(toCategory);
  },

  async getBySlug(_ctx, slug) {
    const { data, error } = await supabaseAdmin.from('categories').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data ? toCategory(data as CategoryRow) : null;
  },
};
