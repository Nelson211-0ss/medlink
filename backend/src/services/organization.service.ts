import { OrganizationRepository } from '../repositories/organization.repository';
import { NotFoundError } from '../utils/errors';
import { OrganizationRow } from '../types/entities';

export class OrganizationService {
  constructor(private organizations: OrganizationRepository) {}

  async getByUserId(userId: string): Promise<OrganizationRow> {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new NotFoundError('Organization profile not found');
    return org;
  }

  async getById(id: string): Promise<OrganizationRow> {
    const org = await this.organizations.findById(id);
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const org = await this.getByUserId(userId);
    return this.organizations.update(org.id, data);
  }
}
