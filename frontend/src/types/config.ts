// Professional Configuration Management Types

export interface ConfigCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface ConfigItem {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  value: string;
  parsedValue: any;
  defaultValue?: string;
  dataType: ConfigDataType;
  validation?: ConfigValidation;
  isRequired: boolean;
  isSecret: boolean;
  isReadOnly: boolean;
  order: number;
  isActive: boolean;
  tags?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type ConfigDataType = 
  | 'string' 
  | 'number' 
  | 'integer' 
  | 'boolean' 
  | 'json' 
  | 'array';

export interface ConfigValidation {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
  required?: boolean;
  custom?: Record<string, any>;
}

export interface ConfigCategoryWithItems {
  category: ConfigCategory;
  items: ConfigItem[];
}

export interface ConfigResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
  timestamp: string;
}

export interface CreateConfigRequest {
  categoryId: string;
  name: string;
  displayName: string;
  description?: string;
  value?: any;
  defaultValue?: any;
  dataType?: ConfigDataType;
  validation?: ConfigValidation;
  isRequired?: boolean;
  isSecret?: boolean;
  isReadOnly?: boolean;
  order?: number;
  tags?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateConfigRequest {
  displayName?: string;
  description?: string;
  value?: any;
  defaultValue?: any;
  dataType?: ConfigDataType;
  validation?: ConfigValidation;
  isRequired?: boolean;
  isSecret?: boolean;
  isReadOnly?: boolean;
  order?: number;
  isActive?: boolean;
  tags?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ConfigSearchResult {
  item: ConfigItem;
  category: ConfigCategory;
  matchType: 'name' | 'description' | 'value';
  matchText: string;
}

export interface ConfigHistory {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changeReason?: string;
  createdAt: string;
}

export interface ConfigStats {
  totalCategories: number;
  totalItems: number;
  activeItems: number;
  secretItems: number;
  readOnlyItems: number;
  recentlyUpdated: number;
}

// UI State Types
export interface ConfigUIState {
  selectedCategory?: string;
  selectedItem?: string;
  searchQuery: string;
  viewMode: 'grid' | 'list' | 'tree';
  showSecrets: boolean;
  showInactive: boolean;
  editMode: boolean;
  loading: boolean;
  error?: string;
}

// Form Types
export interface ConfigFormData {
  displayName: string;
  description: string;
  value: any;
  dataType: ConfigDataType;
  isRequired: boolean;
  isSecret: boolean;
  isReadOnly: boolean;
  tags: string[];
  metadata: Record<string, any>;
}

export interface ConfigFormErrors {
  displayName?: string;
  description?: string;
  value?: string;
  dataType?: string;
  general?: string;
}

// Filter Types
export interface ConfigFilter {
  categories?: string[];
  dataTypes?: ConfigDataType[];
  isRequired?: boolean;
  isSecret?: boolean;
  isReadOnly?: boolean;
  isActive?: boolean;
  updatedAfter?: string;
  updatedBefore?: string;
  updatedBy?: string;
}

// Sort Types
export type ConfigSortField = 
  | 'name' 
  | 'displayName' 
  | 'dataType' 
  | 'updatedAt' 
  | 'createdAt' 
  | 'order';

export type ConfigSortDirection = 'asc' | 'desc';

export interface ConfigSort {
  field: ConfigSortField;
  direction: ConfigSortDirection;
}

// Export/Import Types
export interface ConfigExport {
  version: string;
  exportedAt: string;
  exportedBy: string;
  categories: ConfigCategory[];
  items: ConfigItem[];
}

export interface ConfigImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

// Validation Types
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Permission Types for Config
export interface ConfigPermissions {
  canRead: boolean;
  canUpdate: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canManageCategories: boolean;
  canViewSecrets: boolean;
  canExport: boolean;
  canImport: boolean;
}

// Theme/Icon mapping for categories
export const CONFIG_CATEGORY_ICONS: Record<string, string> = {
  system: 'Settings',
  network: 'Network',
  security: 'Shield',
  database: 'Database',
  logging: 'FileText',
  email: 'Mail',
  api: 'Code',
  ui: 'Palette',
  performance: 'Zap',
  backup: 'Archive',
  monitoring: 'Activity',
  integration: 'Link',
};

export const CONFIG_CATEGORY_COLORS: Record<string, string> = {
  system: 'blue',
  network: 'green',
  security: 'red',
  database: 'purple',
  logging: 'orange',
  email: 'cyan',
  api: 'indigo',
  ui: 'pink',
  performance: 'yellow',
  backup: 'gray',
  monitoring: 'emerald',
  integration: 'violet',
};
