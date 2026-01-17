export interface CreateToolNumberConfigDto {
  prefix: string;
  format: string;
  autoIncrement?: boolean;
}

export interface UpdateToolNumberConfigDto {
  prefix?: string;
  format?: string;
  autoIncrement?: boolean;
}

export interface ToolNumberConfigResponse {
  id: string;
  prefix: string;
  format: string;
  example: string;
  autoIncrement: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

