import { readCollection, writeCollection } from '@/lib/data/store';
import { seedUsers } from '@/lib/data/mock/users';
import type { UserProfile } from '@/lib/types/user';
import { assertCan } from '@/lib/rbac/permissions';
import { isStaffRole } from '@/lib/rbac/roles';
import type { UserRepository } from '../user-repository';

function loadAll(): UserProfile[] {
  return readCollection<UserProfile>('users', seedUsers);
}

export const mockUserRepository: UserRepository = {
  async list(ctx) {
    if (!isStaffRole(ctx.role)) throw new Error('Role lacks permission to list users');
    return loadAll();
  },

  async getById(_ctx, id) {
    return loadAll().find((u) => u.id === id) ?? null;
  },

  async getByAuthId() {
    // The mock store has no concept of Supabase Auth linkage — only relevant when DATA_SOURCE=supabase.
    return null;
  },

  async update(ctx, id, patch) {
    const isSelf = ctx.userId === id;
    if (!isSelf) {
      assertCan(ctx.role, 'manage_users');
    }
    const users = loadAll();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`User not found: ${id}`);
    const updated = { ...users[index], ...patch } as UserProfile;
    users[index] = updated;
    writeCollection('users', users);
    return updated;
  },

  async create(input) {
    const users = loadAll();
    const user = { ...input, id: `user-${Date.now()}`, createdAt: new Date().toISOString() } as UserProfile;
    writeCollection('users', [...users, user]);
    return user;
  },
};
