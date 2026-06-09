import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created } from '../utils/apiResponse';
import { BadRequestError } from '../utils/errors';
import { UploadKind } from '../services/file.service';

const { fileService } = container.services;

export const fileController = {
  upload: (kind: UploadKind) =>
    asyncHandler(async (req, res) => {
      const file = (req as unknown as { file?: Express.Multer.File }).file;
      if (!file) throw new BadRequestError('No file provided');
      const result = await fileService.upload(kind, req.user!.id, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      });
      return created(res, result, 'File uploaded');
    }),
};
