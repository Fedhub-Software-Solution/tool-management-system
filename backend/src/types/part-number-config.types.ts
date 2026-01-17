export interface CreatePartNumberConfigDto {
  prefix: string;
  format: string;
  autoIncrement?: boolean;
}

export interface UpdatePartNumberConfigDto {
  prefix?: string;
  format?: string;
  autoIncrement?: boolean;
}

export interface PartNumberConfigResponse {
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

