import { supabaseAdmin } from '@/lib/supabase/admin-client';
import type { UserProfile, Address, NewUserProfile } from '@/lib/types/user';
import type { Role } from '@/lib/rbac/roles';
import type { Locale } from '@/lib/types/common';
import type { CreditLimit } from '@/lib/types/receivable';
import { assertCan } from '@/lib/rbac/permissions';
import type { UserRepository } from '../user-repository';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  locale: Locale;
  addresses: Address[] | null;
  business_name: string | null;
  trade_license_number: string | null;
  trade_license_file_url: string | null;
  credit_limit: CreditLimit | null;
  assigned_sales_rep_id: string | null;
  approved_for_wholesale_pricing: boolean | null;
  created_at: string;
}

function toUser(row: UserRow): UserProfile {
  const base = {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone ?? undefined,
    locale: row.locale,
    createdAt: row.created_at,
  };

  if (row.role === 'retail_customer') {
    return { ...base, role: 'retail_customer', addresses: row.addresses ?? [] };
  }
  if (row.role === 'wholesale_customer') {
    return {
      ...base,
      role: 'wholesale_customer',
      businessName: row.business_name ?? '',
      tradeLicenseNumber: row.trade_license_number ?? undefined,
      tradeLicenseFileUrl: row.trade_license_file_url ?? undefined,
      creditLimit: row.credit_limit ?? { limit: 0, currentBalance: 0, availableCredit: 0 },
      assignedSalesRepId: row.assigned_sales_rep_id,
      approvedForWholesalePricing: true,
    };
  }
  return { ...base, role: row.role };
}

function fromUser(user: NewUserProfile | Partial<UserProfile>) {
  const row: Record<string, unknown> = {
    email: user.email,
    full_name: user.fullName,
    phone: user.phone ?? null,
    role: user.role,
    locale: user.locale,
  };
  if ('addresses' in user) row.addresses = user.addresses;
  if ('businessName' in user) row.business_name = user.businessName;
  if ('tradeLicenseNumber' in user) row.trade_license_number = user.tradeLicenseNumber ?? null;
  if ('tradeLicenseFileUrl' in user) row.trade_license_file_url = user.tradeLicenseFileUrl ?? null;
  if ('creditLimit' in user) row.credit_limit = user.creditLimit;
  if ('assignedSalesRepId' in user) row.assigned_sales_rep_id = user.assignedSalesRepId ?? null;
  if ('approvedForWholesalePricing' in user) row.approved_for_wholesale_pricing = user.approvedForWholesalePricing;
  return row;
}

export const supabaseUserRepository: UserRepository = {
  async list(ctx) {
    assertCan(ctx.role, 'manage_users');
    const { data, error } = await supabaseAdmin.from('users').select('*');
    if (error) throw error;
    return (data as UserRow[]).map(toUser);
  },

  async getById(_ctx, id) {
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toUser(data as UserRow) : null;
  },

  async update(ctx, id, patch) {
    const isSelf = ctx.userId === id;
    if (!isSelf) {
      assertCan(ctx.role, 'manage_users');
    }
    const { data, error } = await supabaseAdmin.from('users').update(fromUser(patch)).eq('id', id).select().single();
    if (error) throw error;
    return toUser(data as UserRow);
  },

  async create(input) {
    const id = `user-${Date.now()}`;
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ id, ...fromUser(input) })
      .select()
      .single();
    if (error) throw error;
    return toUser(data as UserRow);
  },
};
