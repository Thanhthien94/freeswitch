'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Save,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';
import { ConfigItem as ConfigItemType } from '@/types/config';
import { configService } from '@/services/config.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConfigItemProps {
  item: ConfigItemType;
  categoryName: string;
  onUpdate?: (updatedItem: ConfigItemType) => void;
  editMode?: boolean;
  showSecrets?: boolean;
  compact?: boolean;
}

export default function ConfigItem({
  item,
  categoryName,
  onUpdate,
  editMode = false,
  showSecrets = false,
  compact = false,
}: ConfigItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.value || '');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle value change
  const handleValueChange = useCallback((newValue: string) => {
    setEditValue(newValue);
    
    // Validate value
    const validation = configService.validateValue(item, newValue);
    setValidationError(validation.isValid ? null : validation.error || 'Invalid value');
  }, [item]);

  // Save configuration
  const handleSave = useCallback(async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      let processedValue: any = editValue;

      // Process value based on data type
      switch (item.dataType) {
        case 'boolean':
          processedValue = editValue.toLowerCase() === 'true';
          break;
        case 'number':
          processedValue = parseFloat(editValue);
          break;
        case 'integer':
          processedValue = parseInt(editValue, 10);
          break;
        case 'json':
        case 'array':
          try {
            processedValue = JSON.parse(editValue);
          } catch {
            toast.error('Invalid JSON format');
            return;
          }
          break;
      }

      const updatedItem = await configService.updateConfigValue(
        categoryName,
        item.name,
        processedValue
      );

      setIsEditing(false);
      onUpdate?.(updatedItem);
      toast.success(`Configuration "${item.displayName}" updated successfully`);
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }, [editValue, validationError, item, categoryName, onUpdate]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setEditValue(item.value || '');
    setIsEditing(false);
    setValidationError(null);
  }, [item.value]);

  // Reset to default
  const handleReset = useCallback(async () => {
    if (!item.defaultValue) return;

    setSaving(true);
    try {
      const updatedItem = await configService.updateConfigValue(
        categoryName,
        item.name,
        item.defaultValue
      );

      setEditValue(item.defaultValue);
      onUpdate?.(updatedItem);
      toast.success(`Configuration "${item.displayName}" reset to default`);
    } catch (error) {
      console.error('Failed to reset config:', error);
      toast.error('Failed to reset configuration');
    } finally {
      setSaving(false);
    }
  }, [item, categoryName, onUpdate]);

  // Render value based on type and state
  const renderValue = () => {
    if (isEditing) {
      switch (item.dataType) {
        case 'boolean':
          return (
            <div className="flex items-center space-x-2">
              <Switch
                checked={editValue === 'true'}
                onCheckedChange={(checked) => handleValueChange(checked ? 'true' : 'false')}
                disabled={saving}
              />
              <Label className="text-sm">
                {editValue === 'true' ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
          );

        case 'json':
        case 'array':
          return (
            <Textarea
              value={editValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder="Enter valid JSON..."
              className={cn(
                "font-mono text-sm",
                validationError && "border-red-500"
              )}
              rows={6}
              disabled={saving}
            />
          );

        default:
          return (
            <Input
              type={item.dataType === 'number' || item.dataType === 'integer' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={item.defaultValue || 'Enter value...'}
              className={cn(
                validationError && "border-red-500"
              )}
              disabled={saving}
            />
          );
      }
    }

    // Display mode
    if (item.isSecret && !showSecret && !showSecrets) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground">***</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSecret(true)}
            className="h-6 px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    const displayValue = configService.formatValue(item);
    
    if (item.dataType === 'json' || item.dataType === 'array') {
      return (
        <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
          {displayValue}
        </pre>
      );
    }

    if (item.dataType === 'boolean') {
      return (
        <Badge variant={item.parsedValue ? 'default' : 'secondary'}>
          {item.parsedValue ? 'Enabled' : 'Disabled'}
        </Badge>
      );
    }

    return (
      <span className={cn(
        "text-sm",
        item.isSecret && "font-mono"
      )}>
        {displayValue}
      </span>
    );
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      compact && "p-3",
      isEditing && "ring-2 ring-primary/20",
      item.isReadOnly && "bg-muted/30"
    )}>
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className={cn(
              "text-base font-medium",
              compact && "text-sm"
            )}>
              {item.displayName}
              {item.isRequired && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </CardTitle>
            
            {item.description && (
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Status badges */}
            {item.isSecret && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="h-6">
                      <Lock className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Secret value</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {item.isReadOnly && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="h-6">
                      <Unlock className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>Read-only</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Badge variant="outline" className="h-6 text-xs">
              {item.dataType}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", compact && "pt-0")}>
        <div className="space-y-3">
          {/* Value display/edit */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Value
            </Label>
            {renderValue()}
            
            {validationError && (
              <p className="text-sm text-red-500 flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          {(editMode || isEditing) && !item.isReadOnly && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || !!validationError}
                      className="h-7"
                    >
                      {saving ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                      className="h-7"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-7"
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit
                  </Button>
                )}
              </div>

              {item.defaultValue && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-muted-foreground"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset to Default</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to reset "{item.displayName}" to its default value?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset}>
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}

          {/* Metadata */}
          {!compact && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <div className="flex items-center space-x-3">
                {item.updatedBy && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{item.updatedBy}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {item.value !== item.defaultValue && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="h-5">
                        <Info className="h-2 w-2" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Modified from default: {item.defaultValue}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
