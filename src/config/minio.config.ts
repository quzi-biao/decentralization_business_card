/**
 * MinIO 配置
 */
export const MINIO_CONFIG = {
  endpoint: 'https://n8n.waters-ai.work:9343', // S3 API 端口 (9443 是浏览器端口，9000 是 API 端口)
  bucket: 'business-card',
  region: 'us-east-1',
};

export const getMinioUploadUrl = (filename: string): string => {
  return `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${filename}`;
};

export const getMinioDownloadUrl = (filename: string): string => {
  return `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${filename}`;
};
