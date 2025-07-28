'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { NetworkConfigStatus as NetworkConfigStatusType } from '@/services/network-config.service';

interface NetworkConfigStatusProps {
  status: NetworkConfigStatusType | undefined;
  isLoading: boolean;
}

export function NetworkConfigStatus({ status, isLoading }: NetworkConfigStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Đang tải...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trạng thái
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Không có dữ liệu trạng thái
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusConfig = () => {
    const configs = {
      active: {
        variant: 'default' as const,
        icon: CheckCircle,
        text: 'Hoạt động',
        description: 'Cấu hình đang hoạt động bình thường',
        color: 'text-green-600',
      },
      pending: {
        variant: 'secondary' as const,
        icon: Clock,
        text: 'Chờ áp dụng',
        description: 'Có thay đổi chưa được áp dụng',
        color: 'text-yellow-600',
      },
      error: {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        text: 'Lỗi',
        description: 'Có lỗi trong cấu hình',
        color: 'text-red-600',
      },
      disabled: {
        variant: 'outline' as const,
        icon: AlertTriangle,
        text: 'Tắt',
        description: 'Cấu hình đã bị tắt',
        color: 'text-gray-600',
      },
    };

    return configs[status.status as keyof typeof configs] || configs.error;
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Trạng thái cấu hình
        </CardTitle>
        <CardDescription>
          Thông tin trạng thái hiện tại
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Trạng thái:</span>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.text}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {statusConfig.description}
        </p>

        <Separator />

        {/* Validation Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Validation:</span>
            <Badge variant={status.isValid ? 'default' : 'destructive'}>
              {status.isValid ? 'Hợp lệ' : 'Có lỗi'}
            </Badge>
          </div>

          {!status.isValid && status.validationErrors && status.validationErrors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-600">Lỗi validation:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {status.validationErrors.slice(0, 3).map((error, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-red-500">•</span>
                    <span>{error}</span>
                  </li>
                ))}
                {status.validationErrors.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    ... và {status.validationErrors.length - 3} lỗi khác
                  </li>
                )}
              </ul>
            </div>
          )}

          {status.validationWarnings && status.validationWarnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-yellow-600">Cảnh báo:</p>
              <ul className="text-xs text-yellow-600 space-y-1">
                {status.validationWarnings.slice(0, 2).map((warning, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-yellow-500">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
                {status.validationWarnings.length > 2 && (
                  <li className="text-xs text-muted-foreground">
                    ... và {status.validationWarnings.length - 2} cảnh báo khác
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <Separator />

        {/* Last Applied Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Lần áp dụng cuối:</span>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{formatDate(status.lastAppliedAt)}</span>
            </div>
            
            {status.lastAppliedBy && (
              <div className="flex justify-between">
                <span>Người thực hiện:</span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {status.lastAppliedBy}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Config ID */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Config ID:</span>
          <span>#{status.configId}</span>
        </div>
      </CardContent>
    </Card>
  );
}
