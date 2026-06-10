import { container } from '../container';
import { asyncHandler } from '../utils/asyncHandler';
import { created } from '../utils/apiResponse';
import { BadRequestError, ForbiddenError } from '../utils/errors';
import { UploadKind } from '../services/file.service';
import { ROLES } from '../utils/constants';

const { fileService, authService, organizationService, professionalService } = container.services;
const { userRepo, organizationRepo } = container.repositories;

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

  uploadCv: asyncHandler(async (req, res) => {
    if (req.user!.role !== ROLES.PROFESSIONAL) {
      throw new ForbiddenError('Only professionals can upload a CV');
    }
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw new BadRequestError('No file provided');
    const result = await fileService.upload('cv', req.user!.id, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });
    const url = await professionalService.setCvUrl(req.user!.id, result.objectName);
    return created(res, { url, objectName: result.objectName }, 'CV uploaded');
  }),

  uploadOrgLogo: asyncHandler(async (req, res) => {
    if (req.user!.role !== ROLES.ORGANIZATION) {
      throw new ForbiddenError('Only organizations can upload a logo');
    }
    const file = (req as unknown as { file?: Express.Multer.File }).file;
    if (!file) throw new BadRequestError('No image provided');
    const org = await organizationRepo.findByUserId(req.user!.id);
    if (!org) throw new ForbiddenError('Organization profile required');

    const result = await fileService.upload('logo', org.id, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    });
    await organizationRepo.updateLogo(org.id, result.objectName);
    const url = await fileService.resolveUrl(result.objectName);
    const organization = await organizationService.getByUserId(req.user!.id);
    return created(res, { url, objectName: result.objectName, organization }, 'Organization logo updated');
  }),
};
