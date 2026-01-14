/**
 * MinIO 配置
 */
export const MINIO_CONFIG = {
  endpoint: 'http://101.34.87.172:9000', // S3 API 端口
  bucket: 'business-card',
  region: 'us-east-1',
};

export const getMinioUploadUrl = (filename: string): string => {
  return `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${filename}`;
};

export const getMinioDownloadUrl = (filename: string): string => {
  return `${MINIO_CONFIG.endpoint}/${MINIO_CONFIG.bucket}/${filename}`;
};
