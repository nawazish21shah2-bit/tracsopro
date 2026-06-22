import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../../services/api/adminApi';

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'guard' | 'client';
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  lastLogin?: string;
  createdAt: string;
}

function mapBackendUser(u: any): UserListItem {
  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
  const roleMap: Record<string, UserListItem['role']> = {
    ADMIN: 'admin',
    GUARD: 'guard',
    CLIENT: 'client',
    SUPER_ADMIN: 'admin',
  };
  return {
    id: u.id,
    name: fullName,
    email: u.email,
    role: roleMap[u.role] || 'guard',
    status: u.isActive === false ? 'inactive' : 'active',
    department: u.guard?.department || u.department,
    lastLogin: u.lastLoginAt || u.lastLogin,
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

export function useUserList(roleFilter?: 'all' | 'admin' | 'guard' | 'client') {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roleMap: Record<string, 'ADMIN' | 'GUARD' | 'CLIENT' | undefined> = {
        all: undefined,
        admin: 'ADMIN',
        guard: 'GUARD',
        client: 'CLIENT',
      };
      const response = await adminApi.getAdminUsers({
        role: roleFilter ? roleMap[roleFilter] : undefined,
        limit: 100,
      });
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load users');
      }
      const backendUsers = response.data.users as any[];
      setUsers((backendUsers || []).map(mapBackendUser));
    } catch (e: any) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refresh: fetchUsers, setUsers };
}
