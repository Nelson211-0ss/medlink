import { Client as MinioClient } from 'minio';
import { env } from './env';
import { logger } from './logger';

export const minioClient = new MinioClient({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const STORAGE_BUCKET = env.MINIO_BUCKET;

/** Ensure the storage bucket exists (and is readable for public assets prefix). */
export const ensureBucket = async (): Promise<void> => {
  try {
    const exists = await minioClient.bucketExists(STORAGE_BUCKET);
    if (!exists) {
      await minioClient.makeBucket(STORAGE_BUCKET, env.AWS_REGION);
      logger.info({ bucket: STORAGE_BUCKET }, 'Created storage bucket');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to ensure storage bucket');
  }
};
