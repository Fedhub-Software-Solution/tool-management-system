import toolNumberConfigRepository from '../repositories/tool-number-config.repository';
import { CreateToolNumberConfigDto, UpdateToolNumberConfigDto, ToolNumberConfigResponse } from '../types/tool-number-config.types';
import { NotFoundError } from '../utils/errors';

// Helper function to generate example from format
function generateExample(format: string, prefix: string): string {
  const year = new Date().getFullYear();
  return format.replace(prefix, prefix).replace('YYYY', year.toString()).replace('XXXX', '0001');
}

export class ToolNumberConfigService {
  /**
   * Get all tool number configurations
   */
  async getAllToolNumberConfigs(): Promise<ToolNumberConfigResponse[]> {
    const configs = await toolNumberConfigRepository.findAll();
    return configs.map((config) => this.mapToToolNumberConfigResponse(config));
  }

  /**
   * Get tool number config by ID
   */
  async getToolNumberConfigById(id: string): Promise<ToolNumberConfigResponse> {
    const config = await toolNumberConfigRepository.findById(id);

    if (!config) {
      throw new NotFoundError('Tool number configuration not found');
    }

    return this.mapToToolNumberConfigResponse(config);
  }

  /**
   * Create tool number config
   */
  async createToolNumberConfig(data: CreateToolNumberConfigDto, createdBy?: string): Promise<ToolNumberConfigResponse> {
    const config = await toolNumberConfigRepository.create({
      ...data,
      createdBy,
    });

    return this.mapToToolNumberConfigResponse(config);
  }

  /**
   * Update tool number config
   */
  async updateToolNumberConfig(id: string, data: UpdateToolNumberConfigDto, updatedBy?: string): Promise<ToolNumberConfigResponse> {
    const config = await toolNumberConfigRepository.findById(id);

    if (!config) {
      throw new NotFoundError('Tool number configuration not found');
    }

    const updatedConfig = await toolNumberConfigRepository.update(id, {
      ...data,
      updatedBy,
    });

    if (!updatedConfig) {
      throw new NotFoundError('Tool number configuration not found');
    }

    return this.mapToToolNumberConfigResponse(updatedConfig);
  }

  /**
   * Delete tool number config
   */
  async deleteToolNumberConfig(id: string): Promise<void> {
    const config = await toolNumberConfigRepository.findById(id);

    if (!config) {
      throw new NotFoundError('Tool number configuration not found');
    }

    await toolNumberConfigRepository.delete(id);
  }

  /**
   * Map ToolNumberConfig entity to ToolNumberConfigResponse
   */
  private mapToToolNumberConfigResponse(config: any): ToolNumberConfigResponse {
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

export default new ToolNumberConfigService();

