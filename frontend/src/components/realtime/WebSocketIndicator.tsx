'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  RefreshCw, 
  Wifi, 
  WifiOff 
} from 'lucide-react';

interface WebSocketIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export function WebSocketIndicator({ className, showLabel = false }: WebSocketIndicatorProps) {
  const { 
    connectionStatus, 
    retryGetToken 
  } = useWebSocket();

  const {
    connected,
    tokenError,
    isRetryingToken,
    error,
    reconnectAttempts,
    maxReconnectAttempts
  } = connectionStatus;

  // Determine status and color
  const getStatus = () => {
    if (isRetryingToken) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        label: 'Đang kết nối...',
        variant: 'secondary' as const,
        color: 'text-blue-500'
      };
    }
    
    if (tokenError) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Lỗi xác thực',
        variant: 'destructive' as const,
        color: 'text-red-500'
      };
    }
    
    if (error) {
      return {
        icon: <WifiOff className="h-4 w-4" />,
        label: 'Lỗi kết nối',
        variant: 'destructive' as const,
        color: 'text-red-500'
      };
    }
    
    if (connected) {
      return {
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Đã kết nối',
        variant: 'default' as const,
        color: 'text-green-500'
      };
    }
    
    return {
      icon: <WifiOff className="h-4 w-4" />,
      label: 'Mất kết nối',
      variant: 'secondary' as const,
      color: 'text-gray-500'
    };
  };

  const status = getStatus();
  const hasError = !!(tokenError || error);

  const getTooltipContent = () => {
    if (tokenError) {
      return (
        <div className="space-y-2">
          <div className="font-medium">Lỗi xác thực WebSocket</div>
          <div className="text-sm">{tokenError}</div>
          <Button
            size="sm"
            variant="outline"
            onClick={retryGetToken}
            disabled={isRetryingToken}
            className="h-6 text-xs"
          >
            {isRetryingToken ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Đang thử lại...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Thử lại
              </>
            )}
          </Button>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="space-y-1">
          <div className="font-medium">Lỗi kết nối WebSocket</div>
          <div className="text-sm">{error}</div>
          {reconnectAttempts > 0 && (
            <div className="text-xs text-muted-foreground">
              Đang thử lại: {reconnectAttempts}/{maxReconnectAttempts}
            </div>
          )}
        </div>
      );
    }
    
    if (isRetryingToken) {
      return (
        <div>
          <div className="font-medium">Đang lấy token xác thực...</div>
          <div className="text-sm text-muted-foreground">Vui lòng đợi</div>
        </div>
      );
    }
    
    if (connected) {
      return (
        <div>
          <div className="font-medium">WebSocket đã kết nối</div>
          <div className="text-sm text-muted-foreground">
            Hệ thống real-time hoạt động bình thường
          </div>
        </div>
      );
    }
    
    return (
      <div>
        <div className="font-medium">WebSocket chưa kết nối</div>
        <div className="text-sm text-muted-foreground">
          Một số tính năng real-time có thể không hoạt động
        </div>
      </div>
    );
  };

  if (showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={status.variant}
              className={`flex items-center gap-2 cursor-pointer ${className}`}
            >
              <span className={status.color}>
                {status.icon}
              </span>
              {status.label}
              {reconnectAttempts > 0 && !tokenError && (
                <span className="text-xs opacity-75">
                  ({reconnectAttempts}/{maxReconnectAttempts})
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            {getTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 ${className}`}
            onClick={hasError ? retryGetToken : undefined}
            disabled={isRetryingToken}
          >
            <span className={status.color}>
              {status.icon}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook để sử dụng trong các component khác
export function useWebSocketStatus() {
  const { connectionStatus, retryGetToken, clearTokenError } = useWebSocket();
  
  return {
    ...connectionStatus,
    retryGetToken,
    clearTokenError,
    hasError: !!(connectionStatus.tokenError || connectionStatus.error),
    isConnected: connectionStatus.connected && !connectionStatus.tokenError,
    isWorking: connectionStatus.connected && !connectionStatus.tokenError && !connectionStatus.error,
  };
}
