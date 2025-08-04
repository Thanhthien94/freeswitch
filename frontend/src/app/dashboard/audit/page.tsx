'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  auditService, 
  AuditLogQueryParams, 
  AuditAction, 
  AuditResult, 
  RiskLevel 
} from '@/services/audit.service';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogQueryParams>({
    page: 1,
    limit: 50,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch audit logs
  const { data: auditData, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => {
      console.log('🔍 Audit Page: Fetching audit logs with filters:', filters);
      return auditService.getAuditLogs(filters);
    },
  });

  // Fetch audit stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => {
      console.log('🔍 Audit Page: Fetching audit stats');
      return auditService.getAuditLogStats();
    },
  });

  // Debug logging
  React.useEffect(() => {
    if (auditData) {
      console.log('✅ Audit Page: Data received successfully:', auditData);
    }
    if (error) {
      console.error('❌ Audit Page: Error fetching data:', error);
    }
  }, [auditData, error]);

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof AuditLogQueryParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleExport = async () => {
    try {
      const exportData = await auditService.exportAuditLogs(filters);
      
      // Create and download CSV file
      const blob = new Blob([exportData.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportData.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getResultIcon = (result: AuditResult) => {
    switch (result) {
      case AuditResult.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case AuditResult.FAILURE:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case AuditResult.WARNING:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case AuditResult.INFO:
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Không thể tải audit logs. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Theo dõi và giám sát tất cả hoạt động trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : statsData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng logs</p>
                  <p className="text-2xl font-bold">{statsData.totalLogs.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hôm nay</p>
                  <p className="text-2xl font-bold">{statsData.todayLogs.toLocaleString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thành công</p>
                  <p className="text-2xl font-bold text-green-600">{statsData.successfulActions.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Thất bại</p>
                  <p className="text-2xl font-bold text-red-600">{statsData.failedActions.toLocaleString()}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rủi ro cao</p>
                  <p className="text-2xl font-bold text-orange-600">{statsData.highRiskEvents.toLocaleString()}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tìm kiếm và Lọc</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Tìm kiếm trong mô tả, tên người dùng, loại tài nguyên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Hành động</label>
                <Select
                  value={filters.action || ''}
                  onValueChange={(value) => handleFilterChange('action', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả hành động" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả hành động</SelectItem>
                    {Object.values(AuditAction).map((action) => (
                      <SelectItem key={action} value={action}>
                        {auditService.formatAction(action)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Kết quả</label>
                <Select
                  value={filters.result || ''}
                  onValueChange={(value) => handleFilterChange('result', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả kết quả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả kết quả</SelectItem>
                    {Object.values(AuditResult).map((result) => (
                      <SelectItem key={result} value={result}>
                        {auditService.formatResult(result)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Mức độ rủi ro</label>
                <Select
                  value={filters.riskLevel || ''}
                  onValueChange={(value) => handleFilterChange('riskLevel', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả mức độ</SelectItem>
                    {Object.values(RiskLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {auditService.formatRiskLevel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tên người dùng</label>
                <Input
                  placeholder="Nhập tên người dùng"
                  value={filters.username || ''}
                  onChange={(e) => handleFilterChange('username', e.target.value || undefined)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Audit Logs</CardTitle>
          <CardDescription>
            {auditData?.pagination ? 
              `Hiển thị ${auditData.data.length} trong tổng số ${auditData.pagination.total} logs` :
              'Đang tải...'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : auditData?.data.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Không có audit logs</h3>
              <p className="text-muted-foreground">
                Không tìm thấy audit logs nào với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Kết quả</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Rủi ro</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData?.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{log.username || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {auditService.formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResultIcon(log.result)}
                          <Badge className={auditService.getResultColor(log.result)}>
                            {auditService.formatResult(log.result)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {log.description || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.riskLevel && (
                          <Badge className={auditService.getRiskLevelColor(log.riskLevel)}>
                            {auditService.formatRiskLevel(log.riskLevel)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {log.clientIp || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {auditData?.pagination && auditData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {auditData.pagination.page} / {auditData.pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditData.pagination.page <= 1}
                      onClick={() => handlePageChange(auditData.pagination.page - 1)}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={auditData.pagination.page >= auditData.pagination.totalPages}
                      onClick={() => handlePageChange(auditData.pagination.page + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
