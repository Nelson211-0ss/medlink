import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created } from '../utils/apiResponse';
import { BadRequestError } from '../utils/errors';
import { UploadKind } from '../services/file.service';

const { fileService, authService } = container.services;
const { userRepo } = container.repositories;

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

  uploadAvatar: asyncHandler(async (req, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw new BadRequestError('No image provided');
    const result = await fileService.upload('avatar', req.user!.id, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });
    await userRepo.updateAvatar(req.user!.id, result.objectName);
    const url = await fileService.resolveUrl(result.objectName);
    const user = await authService.me(req.user!.id);
    return created(res, { url, objectName: result.objectName, user }, 'Profile photo updated');
  }),
};
