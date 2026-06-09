import { OrganizationRepository } from '../repositories/organization.repository';
import { FileService } from './file.service';
import { NotFoundError } from '../utils/errors';
import { OrganizationRow } from '../types/entities';

export class OrganizationService {
  constructor(
    private organizations: OrganizationRepository,
    private files: FileService,
  ) {}

  private async withResolvedLogo(org: OrganizationRow) {
    return {
      ...org,
      logo: await this.files.resolveUrl(org.logo),
    };
  }

  async getByUserId(userId: string) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new NotFoundError('Organization profile not found');
    return this.withResolvedLogo(org);
  }

  async getById(id: string) {
    const org = await this.organizations.findById(id);
    if (!org) throw new NotFoundError('Organization not found');
    return this.withResolvedLogo(org);
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new NotFoundError('Organization profile not found');
    const { logo: _logo, ...profileData } = data;
    const updated = (await this.organizations.update(org.id, profileData)) as OrganizationRow;
    return this.withResolvedLogo(updated);
  }
}
