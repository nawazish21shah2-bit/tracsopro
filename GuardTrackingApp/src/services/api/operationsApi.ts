import apiService from '../api';

export const operationsApi = {
  getRaw: <T = unknown>(path: string, config?: Parameters<typeof apiService.getRaw>[1]) =>
    apiService.getRaw<T>(path, config),
  postRaw: <T = unknown>(
    path: string,
    data?: unknown,
    config?: Parameters<typeof apiService.postRaw>[2],
  ) => apiService.postRaw<T>(path, data, config),
};
