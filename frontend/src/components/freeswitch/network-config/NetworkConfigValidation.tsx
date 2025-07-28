'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  X,
  RefreshCw
} from 'lucide-react';
import { NetworkConfigValidationResult } from '@/services/network-config.service';

interface NetworkConfigValidationProps {
  result: NetworkConfigValidationResult;
  isValidating: boolean;
  onClear?: () => void;
}

export function NetworkConfigValidation({ 
  result, 
  isValidating, 
  onClear 
}: NetworkConfigValidationProps) {
  if (isValidating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Đang validation...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Đang kiểm tra cấu hình...
          </div>
        </CardContent>
      </Card>
    );
  }

  const getValidationIcon = () => {
    if (result.isValid && result.warnings.length === 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (result.isValid && result.warnings.length > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getValidationStatus = () => {
    if (result.isValid && result.warnings.length === 0) {
      return {
        variant: 'default' as const,
        text: 'Hợp lệ',
        description: 'Cấu hình không có lỗi',
      };
    } else if (result.isValid && result.warnings.length > 0) {
      return {
        variant: 'secondary' as const,
        text: 'Hợp lệ với cảnh báo',
        description: `Có ${result.warnings.length} cảnh báo`,
      };
    } else {
      return {
        variant: 'destructive' as const,
        text: 'Không hợp lệ',
        description: `Có ${result.errors.length} lỗi`,
      };
    }
  };

  const status = getValidationStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getValidationIcon()}
            Kết quả validation
          </CardTitle>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {status.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-center">
          <Badge variant={status.variant} className="text-sm">
            {status.text}
          </Badge>
        </div>

        {/* Errors */}
        {result.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Lỗi ({result.errors.length}):
                </p>
                <ul className="space-y-1 text-sm">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  Cảnh báo ({result.warnings.length}):
                </p>
                <ul className="space-y-1 text-sm">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {result.isValid && result.warnings.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Validation thành công!</p>
                <p className="text-sm">
                  Cấu hình hợp lệ và có thể áp dụng an toàn.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Tổng số lỗi:</span>
            <span className={result.errors.length > 0 ? 'text-red-600 font-medium' : ''}>
              {result.errors.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tổng số cảnh báo:</span>
            <span className={result.warnings.length > 0 ? 'text-yellow-600 font-medium' : ''}>
              {result.warnings.length}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
