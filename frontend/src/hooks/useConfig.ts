import { useState, useEffect, useCallback, useMemo } from 'react';
import { configService } from '@/services/config.service';
import { 
  ConfigCategoryWithItems, 
  ConfigItem, 
  ConfigCategory,
  ConfigFilter,
  ConfigSort,
  ConfigUIState,
  UpdateConfigRequest
} from '@/types/config';
import { toast } from 'sonner';

export interface UseConfigOptions {
  autoLoad?: boolean;
  category?: string;
  enableSearch?: boolean;
  enableFiltering?: boolean;
}

export const useConfig = (options: UseConfigOptions = {}) => {
  const { autoLoad = true, category, enableSearch = true, enableFiltering = true } = options;

  // State
  const [configs, setConfigs] = useState<ConfigCategoryWithItems[]>([]);
  const [categories, setCategories] = useState<ConfigCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUIState] = useState<ConfigUIState>({
    selectedCategory: category,
    searchQuery: '',
    viewMode: 'grid',
    showSecrets: false,
    showInactive: true,
    editMode: false,
    loading: false,
  });

  // Filters and sorting
  const [filter, setFilter] = useState<ConfigFilter>({});
  const [sort, setSort] = useState<ConfigSort>({
    field: 'order',
    direction: 'asc',
  });

  // Load all configurations
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await configService.getAllConfigs();
      const configsArray = Array.isArray(data) ? data : [];
      setConfigs(configsArray);

      // Extract categories
      const categoryList = configsArray.map(item => item.category);
      setCategories(categoryList);

      toast.success('Configurations loaded successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configurations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories only
  const loadCategories = useCallback(async () => {
    try {
      const data = await configService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Update configuration value
  const updateConfigValue = useCallback(async (
    categoryName: string,
    itemName: string,
    value: any
  ) => {
    setUIState(prev => ({ ...prev, loading: true }));
    
    try {
      const updatedItem = await configService.updateConfigValue(categoryName, itemName, value);
      
      // Update local state
      setConfigs(prev => prev.map(categoryData => {
        if (categoryData.category.name === categoryName) {
          return {
            ...categoryData,
            items: categoryData.items.map(item => 
              item.name === itemName ? updatedItem : item
            ),
          };
        }
        return categoryData;
      }));
      
      toast.success(`Configuration "${itemName}" updated successfully`);
      return updatedItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      toast.error(errorMessage);
      throw err;
    } finally {
      setUIState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Update configuration (full update)
  const updateConfig = useCallback(async (
    categoryName: string,
    itemName: string,
    updateData: UpdateConfigRequest
  ) => {
    setUIState(prev => ({ ...prev, loading: true }));
    
    try {
      const updatedItem = await configService.updateConfig(categoryName, itemName, updateData);
      
      // Update local state
      setConfigs(prev => prev.map(categoryData => {
        if (categoryData.category.name === categoryName) {
          return {
            ...categoryData,
            items: categoryData.items.map(item => 
              item.name === itemName ? updatedItem : item
            ),
          };
        }
        return categoryData;
      }));
      
      toast.success(`Configuration "${itemName}" updated successfully`);
      return updatedItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      toast.error(errorMessage);
      throw err;
    } finally {
      setUIState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Search configurations
  const searchConfigs = useCallback(async (query: string) => {
    if (!enableSearch) return [];
    
    try {
      const results = await configService.searchConfigs(query);
      return results;
    } catch (err) {
      console.error('Search failed:', err);
      return [];
    }
  }, [enableSearch]);

  // Filtered and sorted configurations
  const filteredConfigs = useMemo(() => {
    if (!enableFiltering) return configs;

    return configs.map(categoryData => {
      let items = categoryData.items;

      // Apply filters
      if (filter.categories && filter.categories.length > 0) {
        if (!filter.categories.includes(categoryData.category.name)) {
          return { ...categoryData, items: [] };
        }
      }

      if (filter.dataTypes && filter.dataTypes.length > 0) {
        items = items.filter(item => filter.dataTypes!.includes(item.dataType));
      }

      if (filter.isRequired !== undefined) {
        items = items.filter(item => item.isRequired === filter.isRequired);
      }

      if (filter.isSecret !== undefined) {
        items = items.filter(item => item.isSecret === filter.isSecret);
      }

      if (filter.isReadOnly !== undefined) {
        items = items.filter(item => item.isReadOnly === filter.isReadOnly);
      }

      if (filter.isActive !== undefined) {
        items = items.filter(item => item.isActive === filter.isActive);
      }

      // Apply search
      if (uiState.searchQuery) {
        const query = uiState.searchQuery.toLowerCase();
        items = items.filter(item =>
          item.name.toLowerCase().includes(query) ||
          item.displayName.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          (!item.isSecret && item.value?.toLowerCase().includes(query))
        );
      }

      // Apply sorting
      items.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];

        if (sort.field === 'updatedAt' || sort.field === 'createdAt') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sort.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      return { ...categoryData, items };
    }).filter(categoryData => categoryData.items.length > 0);
  }, [configs, filter, uiState.searchQuery, sort, enableFiltering]);

  // Get configuration by name
  const getConfig = useCallback((categoryName: string, itemName: string): ConfigItem | null => {
    const categoryData = configs.find(c => c.category.name === categoryName);
    return categoryData?.items.find(item => item.name === itemName) || null;
  }, [configs]);

  // Get configurations by category
  const getConfigsByCategory = useCallback((categoryName: string): ConfigItem[] => {
    const categoryData = configs.find(c => c.category.name === categoryName);
    return categoryData?.items || [];
  }, [configs]);

  // UI State helpers
  const setSearchQuery = useCallback((query: string) => {
    setUIState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSelectedCategory = useCallback((categoryName?: string) => {
    setUIState(prev => ({ ...prev, selectedCategory: categoryName }));
  }, []);

  const setViewMode = useCallback((mode: 'grid' | 'list' | 'tree') => {
    setUIState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const toggleShowSecrets = useCallback(() => {
    setUIState(prev => ({ ...prev, showSecrets: !prev.showSecrets }));
  }, []);

  const toggleEditMode = useCallback(() => {
    setUIState(prev => ({ ...prev, editMode: !prev.editMode }));
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadConfigs();
    }
  }, [autoLoad, loadConfigs]);

  return {
    // Data
    configs: filteredConfigs,
    categories,
    
    // State
    loading,
    error,
    uiState,
    filter,
    sort,
    
    // Actions
    loadConfigs,
    loadCategories,
    updateConfigValue,
    updateConfig,
    searchConfigs,
    getConfig,
    getConfigsByCategory,
    
    // UI Actions
    setSearchQuery,
    setSelectedCategory,
    setViewMode,
    toggleShowSecrets,
    toggleEditMode,
    setFilter,
    setSort,
    
    // Computed
    totalItems: configs.reduce((sum, cat) => sum + cat.items.length, 0),
    activeItems: configs.reduce((sum, cat) => sum + cat.items.filter(item => item.isActive).length, 0),
    secretItems: configs.reduce((sum, cat) => sum + cat.items.filter(item => item.isSecret).length, 0),
  };
};
