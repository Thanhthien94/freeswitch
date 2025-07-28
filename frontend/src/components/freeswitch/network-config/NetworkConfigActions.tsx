'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Play, 
  CheckCircle, 
  Wifi, 
  RefreshCw, 
  RotateCcw,
  Settings,
  AlertTriangle
} from 'lucide-react';

interface NetworkConfigActionsProps {
  hasChanges: boolean;
  isValidating: boolean;
  isUpdating: boolean;
  isApplying: boolean;
  isDetectingIp: boolean;
  isSyncing: boolean;
  isResetting: boolean;
  onSave: () => void;
  onValidate: () => void;
  onApply: () => void;
  onDetectIp: () => void;
  onSync: () => void;
  onReset: () => void;
}

export function NetworkConfigActions({
  hasChanges,
  isValidating,
  isUpdating,
  isApplying,
  isDetectingIp,
  isSyncing,
  isResetting,
  onSave,
  onValidate,
  onApply,
  onDetectIp,
  onSync,
  onReset,
}: NetworkConfigActionsProps) {
  const isAnyLoading = isValidating || isUpdating || isApplying || isDetectingIp || isSyncing || isResetting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Thao tác
        </CardTitle>
        <CardDescription>
          Quản lý và áp dụng cấu hình
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-2">
          {/* Save Button */}
          <Button
            onClick={onSave}
            disabled={!hasChanges || isUpdating || isAnyLoading}
            className="w-full"
            variant={hasChanges ? "default" : "secondary"}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </>
            )}
          </Button>

          {/* Validate Button */}
          <Button
            onClick={onValidate}
            disabled={isValidating || isAnyLoading}
            variant="outline"
            className="w-full"
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Đang kiểm tra...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Kiểm tra cấu hình
              </>
            )}
          </Button>

          {/* Apply Button */}
          <Button
            onClick={onApply}
            disabled={isApplying || isAnyLoading}
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isApplying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Đang áp dụng...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Áp dụng cấu hình
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Utility Actions */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Tiện ích</p>
          
          {/* Detect IP Button */}
          <Button
            onClick={onDetectIp}
            disabled={isDetectingIp || isAnyLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isDetectingIp ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Đang phát hiện...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Phát hiện IP external
              </>
            )}
          </Button>

          {/* Sync XML Button */}
          <Button
            onClick={onSync}
            disabled={isSyncing || isAnyLoading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Đang đồng bộ...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Đồng bộ XML
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Danger Zone */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Vùng nguy hiểm</p>
          
          {/* Reset Button */}
          <Button
            onClick={onReset}
            disabled={isResetting || isAnyLoading}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Đang reset...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset về mặc định
              </>
            )}
          </Button>
        </div>

        {/* Warning Messages */}
        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium">Có thay đổi chưa lưu</p>
                <p>Nhớ lưu thay đổi trước khi áp dụng cấu hình.</p>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Lưu:</strong> Lưu thay đổi vào database</p>
          <p><strong>Kiểm tra:</strong> Validate cấu hình</p>
          <p><strong>Áp dụng:</strong> Apply cấu hình vào FreeSWITCH</p>
          <p><strong>Phát hiện IP:</strong> Tự động detect external IP</p>
          <p><strong>Đồng bộ XML:</strong> Sync cấu hình với XML files</p>
        </div>
      </CardContent>
    </Card>
  );
}
