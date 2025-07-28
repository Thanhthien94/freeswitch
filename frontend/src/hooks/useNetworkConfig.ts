import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  networkConfigService,
  GlobalNetworkConfig,
  UpdateNetworkConfigDto,
  NetworkConfigValidationResult,
  ApplyConfigResult,
  ExternalIpDetectionResult,
  NetworkConfigStatus,
} from '@/services/network-config.service';

export interface UseNetworkConfigOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useNetworkConfig(options: UseNetworkConfigOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<NetworkConfigValidationResult | null>(null);

  // Query for current network configuration
  const {
    data: config,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['networkConfig'],
    queryFn: async (): Promise<GlobalNetworkConfig> => {
      console.log('🔍 useNetworkConfig: queryFn called');
      try {
        const result = await networkConfigService.getConfig();
        console.log('🔍 useNetworkConfig: getConfig result:', result);
        return result;
      } catch (error) {
        console.error('❌ useNetworkConfig: getConfig error:', error);
        throw error;
      }
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: 1000,
  });

  // Query for configuration status
  const {
    data: status,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['networkConfigStatus'],
    queryFn: networkConfigService.getConfigStatus,
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Mutation for updating configuration
  const updateConfigMutation = useMutation({
    mutationFn: (config: UpdateNetworkConfigDto) => networkConfigService.updateConfig(config),
    onSuccess: (data) => {
      queryClient.setQueryData(['networkConfig'], data);
      queryClient.invalidateQueries({ queryKey: ['networkConfigStatus'] });
      toast({
        title: 'Thành công',
        description: 'Cấu hình mạng đã được cập nhật thành công',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật cấu hình mạng',
        variant: 'destructive',
      });
    },
  });

  // Mutation for applying configuration
  const applyConfigMutation = useMutation({
    mutationFn: () => networkConfigService.applyConfig(),
    onSuccess: (result: ApplyConfigResult) => {
      queryClient.invalidateQueries({ queryKey: ['networkConfig'] });
      queryClient.invalidateQueries({ queryKey: ['networkConfigStatus'] });
      
      if (result.success) {
        toast({
          title: 'Thành công',
          description: result.message || 'Cấu hình đã được áp dụng thành công',
        });
      } else {
        toast({
          title: 'Cảnh báo',
          description: result.message || 'Có lỗi khi áp dụng cấu hình',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể áp dụng cấu hình',
        variant: 'destructive',
      });
    },
  });

  // Mutation for detecting external IP
  const detectIpMutation = useMutation({
    mutationFn: () => networkConfigService.detectExternalIp(),
    onSuccess: (result: ExternalIpDetectionResult) => {
      if (result.success) {
        toast({
          title: 'Thành công',
          description: `Đã phát hiện IP external: ${result.detectedIp} (${result.method})`,
        });
        return result.detectedIp;
      } else {
        toast({
          title: 'Cảnh báo',
          description: result.error || 'Không thể phát hiện IP external',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể phát hiện IP external',
        variant: 'destructive',
      });
    },
  });

  // Mutation for syncing to XML
  const syncXmlMutation = useMutation({
    mutationFn: () => networkConfigService.syncToXml(),
    onSuccess: (result) => {
      toast({
        title: 'Thành công',
        description: result.message || 'Đã đồng bộ cấu hình với XML files',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể đồng bộ với XML files',
        variant: 'destructive',
      });
    },
  });

  // Mutation for resetting to default
  const resetToDefaultMutation = useMutation({
    mutationFn: () => networkConfigService.resetToDefault(),
    onSuccess: (data) => {
      queryClient.setQueryData(['networkConfig'], data);
      queryClient.invalidateQueries({ queryKey: ['networkConfigStatus'] });
      toast({
        title: 'Thành công',
        description: 'Đã reset cấu hình về mặc định',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể reset cấu hình',
        variant: 'destructive',
      });
    },
  });

  // Validate configuration function
  const validateConfig = useCallback(async (configData: UpdateNetworkConfigDto) => {
    setIsValidating(true);
    try {
      const result = await networkConfigService.validateConfig(configData);
      setValidationResult(result);
      
      if (result.isValid) {
        toast({
          title: 'Validation thành công',
          description: 'Cấu hình hợp lệ',
        });
      } else {
        toast({
          title: 'Validation thất bại',
          description: `Có ${result.errors.length} lỗi trong cấu hình`,
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi validation';
      toast({
        title: 'Lỗi',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Clear validation result
  const clearValidation = useCallback(() => {
    setValidationResult(null);
  }, []);

  // Refresh all data
  const refreshAll = useCallback(() => {
    refetch();
    refetchStatus();
  }, [refetch, refetchStatus]);

  return {
    // Data
    config,
    status,
    validationResult,
    
    // Loading states
    isLoading,
    isStatusLoading,
    isValidating,
    isUpdating: updateConfigMutation.isPending,
    isApplying: applyConfigMutation.isPending,
    isDetectingIp: detectIpMutation.isPending,
    isSyncing: syncXmlMutation.isPending,
    isResetting: resetToDefaultMutation.isPending,
    
    // Error states
    error,
    updateError: updateConfigMutation.error,
    applyError: applyConfigMutation.error,
    
    // Actions
    updateConfig: updateConfigMutation.mutate,
    applyConfig: applyConfigMutation.mutate,
    detectExternalIp: detectIpMutation.mutate,
    syncToXml: syncXmlMutation.mutate,
    resetToDefault: resetToDefaultMutation.mutate,
    validateConfig,
    clearValidation,
    refreshAll,
    refetch,
    refetchStatus,
  };
}
