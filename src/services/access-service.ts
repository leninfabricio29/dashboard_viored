import api from './api';

export interface AccessModule {
  _id: string;
  name: string;
  category?: string;
  icon?: string;
  route?: string;
}

export interface AccessPermission {
  _id: string;
  name: string;
  action: string;
  code: string;
  description: string;
  module: AccessModule | string;
}

export interface AccessRole {
  _id: string;
  name: string;
  permissions: AccessPermission[];
  ownerEntity?: string | null;
}

export interface CurrentUserAccess {
  roleName: string | null;
  permissions: AccessPermission[];
  modules: AccessModule[];
}

export interface CreateModuleInput {
  name: string;
  category: string;
  icon: string;
  route: string;
  is_visible: boolean;
}

export interface CreatePermissionInput {
  name: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  module: string;
  description: string;
}

const accessService = {
  getCurrentUserAccess: async (): Promise<CurrentUserAccess> => {
    const response = await api.get<CurrentUserAccess>('/api/access/me');
    return response.data;
  },

  refreshCurrentUserAccess: async (): Promise<CurrentUserAccess> => {
    const access = await accessService.getCurrentUserAccess();
    localStorage.setItem('modules', JSON.stringify(access.modules));
    if (access.roleName) localStorage.setItem('role', access.roleName);
    window.dispatchEvent(new CustomEvent('access-updated', { detail: access }));
    return access;
  },

  getModules: async (): Promise<AccessModule[]> => {
    const response = await api.get<{ modules: AccessModule[] }>('/api/access/modules');
    return response.data.modules;
  },

  createModule: async (data: CreateModuleInput): Promise<AccessModule> => {
    const response = await api.post<{ module: AccessModule }>('/api/access/modules', data);
    return response.data.module;
  },

  getPermissions: async (): Promise<AccessPermission[]> => {
    const response = await api.get<{ permissions: AccessPermission[] }>('/api/access/permissions');
    return response.data.permissions;
  },

  getRoles: async (): Promise<AccessRole[]> => {
    const response = await api.get<{ roles: AccessRole[] }>('/api/access/roles');
    return response.data.roles;
  },

  createPermission: async (data: CreatePermissionInput): Promise<AccessPermission> => {
    const response = await api.post<{ permission: AccessPermission }>('/api/access/permissions', data);
    return response.data.permission;
  },

  createRole: async (name: string, permissions: string[] = []): Promise<AccessRole> => {
    const response = await api.post<{ role: AccessRole }>('/api/access/roles', { name, permissions });
    return response.data.role;
  },

  assignRoleToUser: async (userId: string, roleId: string): Promise<void> => {
    await api.post('/api/access/assign-role', { userId, roleId });
  },

  assignPermissions: async (roleId: string, permissionIds: string[]): Promise<AccessRole> => {
    const response = await api.post<{ role: AccessRole }>('/api/access/assign-permissions', {
      roleId,
      permissionIds,
    });
    return response.data.role;
  },
};

export default accessService;
