export interface ApiConfig {
  host: string;
  port: number;
  nodeEnv: string;
  uploadDir: string;
  publicUrl: string;
}

export function loadConfig(): ApiConfig {
  return {
    host: process.env.HOST ?? "0.0.0.0",
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    uploadDir: process.env.UPLOAD_DIR ?? "D:\\attach\\anduck",
    publicUrl: process.env.PUBLIC_URL ?? "http://localhost:4000",
  };
}
