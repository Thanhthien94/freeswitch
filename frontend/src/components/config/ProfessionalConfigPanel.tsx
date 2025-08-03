'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Edit3,
  Grid3X3,
  List,
  TreePine,
  Download,
  Upload,
  Plus,
  MoreVertical,
  Activity,
  Clock,
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useConfig } from '@/hooks/useConfig';
import { usePermissions } from '@/components/providers/UserProvider';
import { ConfigCategoryWithItems, ConfigItem as ConfigItemType, ConfigDataType } from '@/types/config';
import ConfigCategory from './ConfigCategory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProfessionalConfigPanel() {
  const {
    configs,
    categories,
    loading,
    error,
    uiState,
    totalItems,
    activeItems,
    secretItems,
    loadConfigs,
    setSearchQuery,
    setSelectedCategory,
    setViewMode,
    toggleShowSecrets,
    toggleEditMode,
    setFilter,
  } = useConfig();

  const { hasPermission } = usePermissions();

  // Local state
  const [selectedDataTypes, setSelectedDataTypes] = useState<ConfigDataType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Permissions
  const canRead = hasPermission('config:read');
  const canUpdate = hasPermission('config:update');
  const canCreate = hasPermission('config:create');
  const canManage = hasPermission('config:manage');

  // Handle item update
  const handleItemUpdate = useCallback((categoryName: string, updatedItem: ConfigItemType) => {
    // The useConfig hook handles the state update
    toast.success(`Configuration "${updatedItem.displayName}" updated successfully`);
  }, []);

  // Handle filter changes
  const handleDataTypeFilter = useCallback((dataType: ConfigDataType, checked: boolean) => {
    const newTypes = checked
      ? [...selectedDataTypes, dataType]
      : selectedDataTypes.filter(t => t !== dataType);
    
    setSelectedDataTypes(newTypes);
    setFilter(prev => ({ ...prev, dataTypes: newTypes.length > 0 ? newTypes : undefined }));
  }, [selectedDataTypes, setFilter]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedDataTypes([]);
    setFilter({});
    setSearchQuery('');
    setSelectedCategory(undefined);
  }, [setFilter, setSearchQuery, setSelectedCategory]);

  // Stats
  const stats = React.useMemo(() => {
    const readOnlyItems = configs.reduce((sum, cat) => 
      sum + cat.items.filter(item => item.isReadOnly).length, 0
    );
    const modifiedItems = configs.reduce((sum, cat) => 
      sum + cat.items.filter(item => item.value !== item.defaultValue).length, 0
    );

    return {
      total: totalItems,
      active: activeItems,
      secret: secretItems,
      readOnly: readOnlyItems,
      modified: modifiedItems,
    };
  }, [configs, totalItems, activeItems, secretItems]);

  if (!canRead) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view configurations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration Management</h1>
          <p className="text-muted-foreground">
            Manage system configurations with professional controls and audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={loadConfigs}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>

          {canUpdate && (
            <Button
              variant={uiState.editMode ? "default" : "outline"}
              onClick={toggleEditMode}
            >
              <Edit3 className="h-4 w-4" />
              {uiState.editMode ? 'Exit Edit' : 'Edit Mode'}
            </Button>
          )}

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Configuration
                </DropdownMenuItem>
                {canCreate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Configuration
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Secret</p>
                <p className="text-2xl font-bold">{stats.secret}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Read-Only</p>
                <p className="text-2xl font-bold">{stats.readOnly}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Modified</p>
                <p className="text-2xl font-bold">{stats.modified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between space-x-4">
            {/* Search */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search configurations..."
                  value={uiState.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category filter */}
              <Select
                value={uiState.selectedCategory || 'all'}
                onValueChange={(value) => setSelectedCategory(value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View controls */}
            <div className="flex items-center space-x-2">
              {/* Show secrets toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-secrets"
                  checked={uiState.showSecrets}
                  onCheckedChange={toggleShowSecrets}
                />
                <Label htmlFor="show-secrets" className="text-sm">
                  Show Secrets
                </Label>
              </div>

              {/* Filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                    Filters
                    {selectedDataTypes.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedDataTypes.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Data Types</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(['string', 'boolean', 'number', 'integer', 'json', 'array'] as ConfigDataType[]).map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedDataTypes.includes(type)}
                      onCheckedChange={(checked) => handleDataTypeFilter(type, checked)}
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    Clear Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View mode */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={uiState.viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={uiState.viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={uiState.viewMode === 'tree' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('tree')}
                  className="rounded-l-none"
                >
                  <TreePine className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Loading configurations...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Categories */}
      {!loading && !error && (
        <div className="space-y-6">
          {configs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Configurations Found</h3>
                  <p className="text-muted-foreground">
                    {uiState.searchQuery || uiState.selectedCategory
                      ? 'Try adjusting your search or filters'
                      : 'No configuration items are available'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            configs.map((categoryData) => (
              <ConfigCategory
                key={categoryData.category.id}
                categoryData={categoryData}
                editMode={uiState.editMode && canUpdate}
                showSecrets={uiState.showSecrets}
                viewMode={uiState.viewMode}
                searchQuery={uiState.searchQuery}
                onItemUpdate={handleItemUpdate}
                defaultExpanded={!uiState.selectedCategory || uiState.selectedCategory === categoryData.category.name}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
