import multer from 'multer';
import { MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_MIME } from '../utils/constants';

/** In-memory upload — the FileService streams the buffer to MinIO/S3. */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in ALLOWED_UPLOAD_MIME) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});
