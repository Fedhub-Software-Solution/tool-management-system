import partNumberConfigRepository from '../repositories/part-number-config.repository';
import { CreatePartNumberConfigDto, UpdatePartNumberConfigDto, PartNumberConfigResponse } from '../types/part-number-config.types';
import { NotFoundError } from '../utils/errors';

// Helper function to generate example from format
function generateExample(format: string, prefix: string): string {
  const year = new Date().getFullYear();
  return format.replace(prefix, prefix).replace('YYYY', year.toString()).replace('XXXX', '0001');
}

export class PartNumberConfigService {
  /**
   * Get all part number configurations
   */
  async getAllPartNumberConfigs(): Promise<PartNumberConfigResponse[]> {
    const configs = await partNumberConfigRepository.findAll();
    return configs.map((config) => this.mapToPartNumberConfigResponse(config));
  }

  /**
   * Get part number config by ID
   */
  async getPartNumberConfigById(id: string): Promise<PartNumberConfigResponse> {
    const config = await partNumberConfigRepository.findById(id);

    if (!config) {
      throw new NotFoundError('Part number configuration not found');
    }

    return this.mapToPartNumberConfigResponse(config);
  }

  /**
   * Create part number config
   */
  async createPartNumberConfig(data: CreatePartNumberConfigDto, createdBy?: string): Promise<PartNumberConfigResponse> {
    const config = await partNumberConfigRepository.create({
      ...data,
      createdBy,
    });

    return this.mapToPartNumberConfigResponse(config);
  }

  /**
   * Update part number config
   */
  async updatePartNumberConfig(id: string, data: UpdatePartNumberConfigDto, updatedBy?: string): Promise<PartNumberConfigResponse> {
    const config = await partNumberConfigRepository.findById(id);

    if (!config) {
      throw new NotFoundError('Part number configuration not found');
    }

    const updatedConfig = await partNumberConfigRepository.update(id, {
      ...data,
      updatedBy,
    });

    if (!updatedConfig) {
      throw new NotFoundError('Part number configuration not found');
    }

    return this.mapToPartNumberConfigResponse(updatedConfig);
  }

  /**
   * Delete part number config
   */
  async deletePartNumberConfig(id: string): Promise<void> {
    const config = await partNumberConfigRepository.findById(id);

    if (!config) {
      throw new NotFoundError('Part number configuration not found');
    }

    await partNumberConfigRepository.delete(id);
  }

  /**
   * Map PartNumberConfig entity to PartNumberConfigResponse
   */
  private mapToPartNumberConfigResponse(config: any): PartNumberConfigResponse {
    const example = generateExample(config.format, config.prefix);
    return {
      id: config.id,
      prefix: config.prefix,
      format: config.format,
      example,
      autoIncrement: config.autoIncrement,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      createdBy: config.createdBy,
      updatedBy: config.updatedBy,
    };
  }
}

export default new PartNumberConfigService();

