'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  Search,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Settings,
  Network,
  Shield,
  Database,
  FileText,
  Mail,
  Code,
  Palette,
  Zap,
  Archive,
  Activity,
  Link,
  Eye,
} from 'lucide-react';
import { ConfigCategoryWithItems, ConfigItem as ConfigItemType } from '@/types/config';
import { CONFIG_CATEGORY_ICONS, CONFIG_CATEGORY_COLORS } from '@/types/config';
import ConfigItem from './ConfigItem';
import { cn } from '@/lib/utils';

interface ConfigCategoryProps {
  categoryData: ConfigCategoryWithItems;
  editMode?: boolean;
  showSecrets?: boolean;
  viewMode?: 'grid' | 'list' | 'tree';
  searchQuery?: string;
  onItemUpdate?: (categoryName: string, updatedItem: ConfigItemType) => void;
  defaultExpanded?: boolean;
  compact?: boolean;
}

// Icon mapping
const iconMap = {
  Settings,
  Network,
  Shield,
  Database,
  FileText,
  Mail,
  Code,
  Palette,
  Zap,
  Archive,
  Activity,
  Link,
};

export default function ConfigCategory({
  categoryData,
  editMode = false,
  showSecrets = false,
  viewMode = 'grid',
  searchQuery = '',
  onItemUpdate,
  defaultExpanded = true,
  compact = false,
}: ConfigCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'order' | 'updatedAt'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { category, items } = categoryData;

  // Get category icon
  const getIcon = () => {
    const iconName = CONFIG_CATEGORY_ICONS[category.name] || 'Settings';
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Settings;
    return IconComponent;
  };

  // Get category color
  const getCategoryColor = () => {
    return CONFIG_CATEGORY_COLORS[category.name] || 'blue';
  };

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = items;

    // Apply search
    const query = (searchQuery || localSearchQuery).toLowerCase();
    if (query) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.displayName.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        (!item.isSecret && item.value?.toLowerCase().includes(query))
      );
    }

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [items, searchQuery, localSearchQuery, sortField, sortDirection]);

  // Stats
  const stats = React.useMemo(() => {
    return {
      total: items.length,
      active: items.filter(item => item.isActive).length,
      secret: items.filter(item => item.isSecret).length,
      readOnly: items.filter(item => item.isReadOnly).length,
      modified: items.filter(item => item.value !== item.defaultValue).length,
    };
  }, [items]);

  const IconComponent = getIcon();
  const categoryColor = getCategoryColor();

  return (
    <Card className="w-full">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  `bg-${categoryColor}-100 text-${categoryColor}-600`,
                  "dark:bg-opacity-20"
                )}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                    <span>{category.displayName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stats.total}
                    </Badge>
                  </CardTitle>
                  
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Stats badges */}
                <div className="flex items-center space-x-1">
                  {stats.secret > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {stats.secret}
                    </Badge>
                  )}
                  
                  {stats.readOnly > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      {stats.readOnly}
                    </Badge>
                  )}
                  
                  {stats.modified > 0 && (
                    <Badge variant="outline" className="text-xs text-orange-600">
                      {stats.modified} modified
                    </Badge>
                  )}
                </div>

                {/* Expand/collapse icon */}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Category controls */}
            {!compact && (
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search in category..."
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Sort dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {sortDirection === 'asc' ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        )}
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortField('order')}>
                        By Order
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortField('name')}>
                        By Name
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortField('updatedAt')}>
                        By Updated Date
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      >
                        {sortDirection === 'asc' ? 'Descending' : 'Ascending'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View mode toggle */}
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-r-none"
                      onClick={() => {/* View mode handled by parent */}}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      className="rounded-l-none"
                      onClick={() => {/* View mode handled by parent */}}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Items grid/list */}
            {filteredAndSortedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No configuration items found</p>
                {(searchQuery || localSearchQuery) && (
                  <p className="text-sm">Try adjusting your search query</p>
                )}
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : viewMode === 'tree'
                  ? "space-y-2"
                  : "space-y-4"
              )}>
                {filteredAndSortedItems.map((item) => (
                  <ConfigItem
                    key={item.id}
                    item={item}
                    categoryName={category.name}
                    onUpdate={(updatedItem) => onItemUpdate?.(category.name, updatedItem)}
                    editMode={editMode}
                    showSecrets={showSecrets}
                    compact={compact || viewMode === 'list' || viewMode === 'tree'}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
