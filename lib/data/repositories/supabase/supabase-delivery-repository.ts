import { supabaseAdmin } from '@/lib/supabase/admin-client';
import type { DeliveryRegion } from '@/lib/types/delivery';
import type { Emirate } from '@/lib/types/common';
import type { DeliveryRepository } from '../delivery-repository';

interface DeliveryRegionRow {
  id: string;
  emirate: Emirate;
  area: string;
  name_en: string;
  name_ar: string;
  delivery_fee: number;
  is_active: boolean;
}

function toDeliveryRegion(row: DeliveryRegionRow): DeliveryRegion {
  return {
    id: row.id,
    emirate: row.emirate,
    area: row.area,
    name: { en: row.name_en, ar: row.name_ar },
    deliveryFee: row.delivery_fee,
    isActive: row.is_active,
  };
}

export const supabaseDeliveryRepository: DeliveryRepository = {
  async list() {
    const { data, error } = await supabaseAdmin.from('delivery_regions').select('*');
    if (error) throw error;
    return (data as DeliveryRegionRow[]).map(toDeliveryRegion);
  },

  async getById(_ctx, id) {
    const { data, error } = await supabaseAdmin.from('delivery_regions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toDeliveryRegion(data as DeliveryRegionRow) : null;
  },
};
