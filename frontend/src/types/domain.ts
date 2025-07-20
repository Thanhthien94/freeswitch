export interface Domain {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainDto {
  name: string;
  displayName?: string;
  description?: string;
  enabled?: boolean;
}

export interface UpdateDomainDto extends Partial<CreateDomainDto> {
  id?: string; // Domain ID for updates
}

export interface DomainQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DomainResponse {
  data: Domain[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
