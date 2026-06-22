import apiService from '../api';

/** Authenticated HTTP helpers for super-admin routes (used by superAdminService). */
export const superAdminApi = {
  get: <T = unknown>(path: string, config?: Parameters<typeof apiService.get>[1]) =>
    apiService.get<T>(path, config),
  post: <T = unknown>(
    path: string,
    data?: unknown,
    config?: Parameters<typeof apiService.post>[2],
  ) => apiService.post<T>(path, data, config),
  put: <T = unknown>(path: string, data?: unknown, config?: Parameters<typeof apiService.put>[2]) =>
    apiService.put<T>(path, data, config),
  patch: <T = unknown>(
    path: string,
    data?: unknown,
    config?: Parameters<typeof apiService.patch>[2],
  ) => apiService.patch<T>(path, data, config),
  delete: <T = unknown>(path: string, config?: Parameters<typeof apiService.delete>[1]) =>
    apiService.delete<T>(path, config),
};
