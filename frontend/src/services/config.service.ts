import { api } from '@/lib/api-client';

// Professional Config Types
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
  dataType: 'string' | 'number' | 'integer' | 'boolean' | 'json' | 'array';
  validation?: any;
  isRequired: boolean;
  isSecret: boolean;
  isReadOnly: boolean;
  order: number;
  isActive: boolean;
  tags?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
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
  dataType?: string;
  validation?: any;
  isRequired?: boolean;
  isSecret?: boolean;
  isReadOnly?: boolean;
  order?: number;
  tags?: any;
  metadata?: any;
}

export interface UpdateConfigRequest {
  displayName?: string;
  description?: string;
  value?: any;
  defaultValue?: any;
  dataType?: string;
  validation?: any;
  isRequired?: boolean;
  isSecret?: boolean;
  isReadOnly?: boolean;
  order?: number;
  isActive?: boolean;
  tags?: any;
  metadata?: any;
}

// Professional Config Service
export const configService = {
  /**
   * Get all configuration items grouped by categories
   */
  getAllConfigs: async (): Promise<ConfigCategoryWithItems[]> => {
    try {
      const response = await api.get<ConfigResponse<ConfigCategoryWithItems[]>>('/config');
      return (response as any).data || [];
    } catch (error) {
      console.error('Failed to fetch configurations:', error);
      throw new Error('Failed to load configurations');
    }
  },

  /**
   * Get all configuration categories
   */
  getCategories: async (): Promise<ConfigCategory[]> => {
    try {
      const response = await api.get<ConfigResponse<ConfigCategory[]>>('/config/categories');
      return (response as any).data || [];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw new Error('Failed to load categories');
    }
  },

  /**
   * Get specific configuration item
   */
  getConfig: async (categoryName: string, itemName: string): Promise<ConfigItem> => {
    try {
      const response = await api.get<ConfigResponse<ConfigItem>>(`/config/${categoryName}/${itemName}`);
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to fetch config ${categoryName}/${itemName}:`, error);
      throw new Error(`Failed to load configuration ${itemName}`);
    }
  },

  /**
   * Update configuration value (simplified)
   */
  updateConfigValue: async (
    categoryName: string,
    itemName: string,
    value: any
  ): Promise<ConfigItem> => {
    try {
      const response = await api.put<ConfigResponse<ConfigItem>>(
        `/config/${categoryName}/${itemName}/value`,
        { value }
      );
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to update config ${categoryName}/${itemName}:`, error);
      throw new Error(`Failed to update configuration ${itemName}`);
    }
  },

  /**
   * Update configuration item (full update)
   */
  updateConfig: async (
    categoryName: string,
    itemName: string,
    updateData: UpdateConfigRequest
  ): Promise<ConfigItem> => {
    try {
      const response = await api.put<ConfigResponse<ConfigItem>>(
        `/config/${categoryName}/${itemName}`,
        updateData
      );
      return (response as any).data;
    } catch (error) {
      console.error(`Failed to update config ${categoryName}/${itemName}:`, error);
      throw new Error(`Failed to update configuration ${itemName}`);
    }
  },

  /**
   * Create new configuration item
   */
  createConfig: async (configData: CreateConfigRequest): Promise<ConfigItem> => {
    try {
      const response = await api.post<ConfigResponse<ConfigItem>>('/config', configData);
      return (response as any).data;
    } catch (error) {
      console.error('Failed to create config:', error);
      throw new Error('Failed to create configuration');
    }
  },

  /**
   * Validate configuration value
   */
  validateValue: (item: ConfigItem, value: any): { isValid: boolean; error?: string } => {
    try {
      // Required field validation
      if (item.isRequired && (value === null || value === undefined || value === '')) {
        return { isValid: false, error: 'This field is required' };
      }

      // Data type validation
      switch (item.dataType) {
        case 'boolean':
          if (typeof value !== 'boolean' && !['true', 'false'].includes(String(value).toLowerCase())) {
            return { isValid: false, error: 'Value must be true or false' };
          }
          break;

        case 'number':
          if (isNaN(Number(value))) {
            return { isValid: false, error: 'Value must be a valid number' };
          }
          break;

        case 'integer':
          if (!Number.isInteger(Number(value))) {
            return { isValid: false, error: 'Value must be a valid integer' };
          }
          break;

        case 'json':
        case 'array':
          try {
            JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
          } catch {
            return { isValid: false, error: 'Value must be valid JSON' };
          }
          break;

        case 'string':
        default:
          // String validation passed
          break;
      }

      // Custom validation rules
      if (item.validation) {
        // Add custom validation logic here based on validation rules
        // For now, just basic validation
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Validation failed' };
    }
  },

  /**
   * Format value for display
   */
  formatValue: (item: ConfigItem): string => {
    if (item.isSecret && item.value) {
      return '***';
    }

    if (item.value === null || item.value === undefined) {
      return item.defaultValue || '';
    }

    switch (item.dataType) {
      case 'json':
      case 'array':
        try {
          return JSON.stringify(item.parsedValue, null, 2);
        } catch {
          return item.value;
        }
      
      case 'boolean':
        return item.parsedValue ? 'true' : 'false';
      
      default:
        return String(item.value);
    }
  },

  /**
   * Get configuration by category
   */
  getConfigsByCategory: async (categoryName: string): Promise<ConfigItem[]> => {
    try {
      const allConfigs = await configService.getAllConfigs();
      const category = allConfigs.find(c => c.category.name === categoryName);
      return category?.items || [];
    } catch (error) {
      console.error(`Failed to fetch configs for category ${categoryName}:`, error);
      throw new Error(`Failed to load ${categoryName} configurations`);
    }
  },

  /**
   * Search configurations
   */
  searchConfigs: async (query: string): Promise<ConfigItem[]> => {
    try {
      const allConfigs = await configService.getAllConfigs();
      const searchTerm = query.toLowerCase();
      
      const results: ConfigItem[] = [];
      
      allConfigs.forEach(categoryData => {
        categoryData.items.forEach(item => {
          if (
            item.name.toLowerCase().includes(searchTerm) ||
            item.displayName.toLowerCase().includes(searchTerm) ||
            item.description?.toLowerCase().includes(searchTerm) ||
            item.value?.toLowerCase().includes(searchTerm)
          ) {
            results.push(item);
          }
        });
      });
      
      return results;
    } catch (error) {
      console.error('Failed to search configurations:', error);
      throw new Error('Failed to search configurations');
    }
  },
};
