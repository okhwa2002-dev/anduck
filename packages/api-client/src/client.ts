import axios, { type AxiosInstance } from "axios";

export interface ApiClientOptions {
  baseURL: string;
  getToken?: () => string | null | Promise<string | null>;
  onUnauthorized?: () => void;
}

export function createApiClient(options: ApiClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL,
    timeout: 15000,
  });

  instance.interceptors.request.use(async (config) => {
    if (options.getToken) {
      const token = await options.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error?.response?.status === 401) {
        options.onUnauthorized?.();
      }

      return Promise.reject(error);
    },
  );

  return instance;
}
