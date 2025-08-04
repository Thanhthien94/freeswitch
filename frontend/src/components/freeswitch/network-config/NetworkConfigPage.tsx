'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Network, 
  Shield, 
  Activity, 
  RefreshCw, 
  Save, 
  Play, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi
} from 'lucide-react';
import { useNetworkConfig } from '@/hooks/useNetworkConfig';
import { NetworkConfigForm } from './NetworkConfigForm';
import { NetworkConfigStatus } from './NetworkConfigStatus';
import { NetworkConfigValidation } from './NetworkConfigValidation';
import { NetworkConfigActions } from './NetworkConfigActions';
import { UpdateNetworkConfigDto, GlobalNetworkConfig } from '@/services/network-config.service';

export function NetworkConfigPage() {
  const {
    config,
    status,
    validationResult,
    isLoading,
    isStatusLoading,
    isValidating,
    isUpdating,
    isApplying,
    isDetectingIp,
    isSyncing,
    isResetting,
    updateConfig,
    applyConfig,
    detectExternalIp,
    syncToXml,
    resetToDefault,
    validateConfig,
    clearValidation,
    refreshAll,
  } = useNetworkConfig({ autoRefresh: false }); // Tắt auto-refresh để cải thiện UX

  // Debug logging
  console.log('🔍 NetworkConfigPage: Hook state:', {
    isLoading,
    hasConfig: !!config,
    configData: config,
    isStatusLoading,
    hasStatus: !!status,
  });

  const [formData, setFormData] = useState<UpdateNetworkConfigDto>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Initialize form data when config loads
  useEffect(() => {
    if (config) {
      const configData = config as GlobalNetworkConfig;
      setFormData({
        externalIp: configData.externalIp || 'auto',
        bindServerIp: configData.bindServerIp,
        domain: configData.domain,
        sipPort: configData.sipPort,
        externalSipPort: configData.externalSipPort,
        tlsPort: configData.tlsPort,
        externalTlsPort: configData.externalTlsPort,
        rtpStartPort: configData.rtpStartPort,
        rtpEndPort: configData.rtpEndPort,
        externalRtpIp: configData.externalRtpIp,
        stunServer: configData.stunServer,
        stunEnabled: configData.stunEnabled,
        globalCodecPrefs: configData.globalCodecPrefs,
        outboundCodecPrefs: configData.outboundCodecPrefs,
        transportProtocols: configData.transportProtocols,
        enableTls: configData.enableTls,
        natDetection: configData.natDetection,
        autoNat: configData.autoNat,
        autoApply: configData.autoApply,
      });
      setHasChanges(false);
    }
  }, [config]);

  const handleFormChange = (data: UpdateNetworkConfigDto) => {
    setFormData(data);
    setHasChanges(true);
    clearValidation();
  };

  const handleSave = async () => {
    try {
      await updateConfig(formData);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleValidate = async () => {
    try {
      await validateConfig(formData);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleApply = async () => {
    try {
      await applyConfig();
    } catch (error) {
      console.error('Failed to apply configuration:', error);
    }
  };

  const handleDetectIp = async () => {
    try {
      const result = await detectExternalIp();
      // Tự động điền detected IP vào form
      if (result && result.success && result.detectedIp) {
        setFormData(prev => ({
          ...prev,
          externalIp: result.detectedIp
        }));
        setHasChanges(true);
        console.log('✅ Auto-filled detected IP:', result.detectedIp);
      }
    } catch (error) {
      console.error('Failed to detect IP:', error);
    }
  };

  const handleReset = async () => {
    if (confirm('Bạn có chắc chắn muốn reset cấu hình về mặc định?')) {
      try {
        await resetToDefault();
        setHasChanges(false);
      } catch (error) {
        console.error('Failed to reset configuration:', error);
      }
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;

    const statusConfig = {
      active: { variant: 'default' as const, icon: CheckCircle, text: 'Hoạt động' },
      pending: { variant: 'secondary' as const, icon: Clock, text: 'Chờ áp dụng' },
      error: { variant: 'destructive' as const, icon: AlertTriangle, text: 'Lỗi' },
      disabled: { variant: 'outline' as const, icon: AlertTriangle, text: 'Tắt' },
    };

    const config = statusConfig[status.status as keyof typeof statusConfig] || statusConfig.error;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải cấu hình...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cấu hình mạng toàn cục</h1>
          <p className="text-muted-foreground">
            Quản lý cấu hình mạng tập trung cho hệ thống FreeSWITCH
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isLoading || isStatusLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isStatusLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {status && !status.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Cấu hình hiện tại có {status.validationErrors?.length || 0} lỗi. 
            Vui lòng kiểm tra và sửa lỗi trước khi áp dụng.
          </AlertDescription>
        </Alert>
      )}

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Bạn có thay đổi chưa được lưu. Nhấn "Lưu" để lưu thay đổi hoặc "Làm mới" để hủy bỏ.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cấu hình mạng
              </CardTitle>
              <CardDescription>
                Cấu hình các thông số mạng cho FreeSWITCH
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Chung</TabsTrigger>
                  <TabsTrigger value="ports">Cổng</TabsTrigger>
                  <TabsTrigger value="codecs">Codec</TabsTrigger>
                  <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <NetworkConfigForm
                    data={formData}
                    onChange={handleFormChange}
                    activeTab={activeTab}
                    isLoading={isUpdating}
                  />
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <NetworkConfigStatus
            status={status}
            isLoading={isStatusLoading}
          />

          {/* Validation Results */}
          {validationResult && (
            <NetworkConfigValidation
              result={validationResult}
              isValidating={isValidating}
            />
          )}

          {/* Actions Card */}
          <NetworkConfigActions
            hasChanges={hasChanges}
            isValidating={isValidating}
            isUpdating={isUpdating}
            isApplying={isApplying}
            isDetectingIp={isDetectingIp}
            isSyncing={isSyncing}
            isResetting={isResetting}
            onSave={handleSave}
            onValidate={handleValidate}
            onApply={handleApply}
            onDetectIp={handleDetectIp}
            onSync={syncToXml}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
}
