import { randomUUID } from 'crypto';
import { minioClient, minioPublicClient, STORAGE_BUCKET } from '../config/storage';
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from '../utils/constants';
import { BadRequestError } from '../utils/errors';

export type UploadKind = 'avatar' | 'cv' | 'certificate' | 'license' | 'message' | 'logo';

export class FileService {
  validate(file: { mimetype: string; size: number }) {
    if (!(file.mimetype in ALLOWED_UPLOAD_MIME)) {
      throw new BadRequestError('Unsupported file type. Allowed: pdf, jpg, jpeg, png');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestError('File exceeds the 10MB limit');
    }
  }

  async upload(
    kind: UploadKind,
    ownerId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
  ): Promise<{ url: string; objectName: string }> {
    this.validate(file);
    const ext = ALLOWED_UPLOAD_MIME[file.mimetype as keyof typeof ALLOWED_UPLOAD_MIME];
    const objectName = `${kind}/${ownerId}/${randomUUID()}.${ext}`;
    await minioClient.putObject(STORAGE_BUCKET, objectName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
    return { url: await this.presignedUrl(objectName), objectName };
  }

  /** Time-limited download URL (works for both MinIO and S3-compatible). */
  presignedUrl(objectName: string, expirySeconds = 7 * 24 * 60 * 60): Promise<string> {
    return minioPublicClient.presignedGetObject(STORAGE_BUCKET, objectName, expirySeconds);
  }

  /** Turn a stored object key (or legacy http URL) into a browser-ready URL. */
  async resolveUrl(stored: string | null | undefined): Promise<string | null> {
    if (!stored) return null;
    if (stored.startsWith('http://') || stored.startsWith('https://')) return stored;
    return this.presignedUrl(stored);
  }

  async remove(objectName: string): Promise<void> {
    await minioClient.removeObject(STORAGE_BUCKET, objectName);
  }
}
