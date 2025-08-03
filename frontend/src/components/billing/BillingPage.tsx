'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  Calendar,
  Download,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface BillingRecord {
  id: string;
  extension: string;
  callType: 'inbound' | 'outbound' | 'internal';
  destination: string;
  duration: number;
  cost: number;
  date: string;
  status: 'billed' | 'pending' | 'disputed';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  extension: string;
  period: string;
  totalCalls: number;
  totalDuration: number;
  totalCost: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

interface BillingStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalCalls: number;
  averageCostPerCall: number;
}

export function BillingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const loadBillingData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: BillingStats = {
        totalRevenue: 15420.50,
        monthlyRevenue: 3240.75,
        pendingAmount: 890.25,
        overdueAmount: 245.80,
        totalCalls: 1247,
        averageCostPerCall: 12.37
      };

      const mockRecords: BillingRecord[] = [
        {
          id: '1',
          extension: '1001',
          callType: 'outbound',
          destination: '+84901234567',
          duration: 185,
          cost: 15.20,
          date: '2024-01-15T10:30:00Z',
          status: 'billed'
        },
        {
          id: '2',
          extension: '1002',
          callType: 'inbound',
          destination: '+84987654321',
          duration: 92,
          cost: 0,
          date: '2024-01-15T11:15:00Z',
          status: 'billed'
        },
        {
          id: '3',
          extension: '1003',
          callType: 'outbound',
          destination: '+84912345678',
          duration: 245,
          cost: 22.50,
          date: '2024-01-15T14:20:00Z',
          status: 'pending'
        }
      ];

      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          extension: '1001',
          period: '2024-01',
          totalCalls: 156,
          totalDuration: 12450,
          totalCost: 1240.50,
          status: 'paid',
          dueDate: '2024-02-15',
          createdAt: '2024-01-31'
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          extension: '1002',
          period: '2024-01',
          totalCalls: 89,
          totalDuration: 7890,
          totalCost: 890.25,
          status: 'sent',
          dueDate: '2024-02-15',
          createdAt: '2024-01-31'
        },
        {
          id: '3',
          invoiceNumber: 'INV-2024-003',
          extension: '1003',
          period: '2024-01',
          totalCalls: 67,
          totalDuration: 5670,
          totalCost: 245.80,
          status: 'overdue',
          dueDate: '2024-02-15',
          createdAt: '2024-01-31'
        }
      ];
      
      setBillingStats(mockStats);
      setBillingRecords(mockRecords);
      setInvoices(mockInvoices);
      setIsLoading(false);
    };

    loadBillingData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount * 1000); // Convert to VND
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'paid': 'default',
      'sent': 'secondary',
      'draft': 'outline',
      'overdue': 'destructive',
      'billed': 'default',
      'pending': 'secondary',
      'disputed': 'destructive'
    } as const;

    const labels = {
      'paid': 'Đã thanh toán',
      'sent': 'Đã gửi',
      'draft': 'Bản nháp',
      'overdue': 'Quá hạn',
      'billed': 'Đã tính phí',
      'pending': 'Chờ xử lý',
      'disputed': 'Tranh chấp'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Đang tải dữ liệu billing...</span>
        </div>
      </div>
    );
  }

  if (!billingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground">Chưa có dữ liệu billing để hiển thị.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Invoicing</h1>
          <p className="text-muted-foreground">
            Quản lý hóa đơn và tính phí cuộc gọi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tạo hóa đơn
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingStats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {billingStats.totalCalls} cuộc gọi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingStats.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Cần thu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(billingStats.overdueAmount)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              Cần xử lý
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Billing */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="records">Chi tiết cuộc gọi</TabsTrigger>
          <TabsTrigger value="invoices">Hóa đơn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Thống kê doanh thu</CardTitle>
                <CardDescription>
                  Biểu đồ doanh thu theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Biểu đồ doanh thu</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tích hợp chart library để hiển thị xu hướng doanh thu
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Extensions theo doanh thu</CardTitle>
                <CardDescription>
                  Extensions tạo ra doanh thu cao nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['1001', '1002', '1003', '1004', '1005'].map((ext, index) => (
                    <div key={ext} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs">
                          {index + 1}
                        </div>
                        <span className="text-sm">Extension {ext}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(Math.random() * 500 + 100)}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(Math.random() * 50 + 20)} cuộc gọi
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chi tiết cuộc gọi</CardTitle>
                  <CardDescription>
                    Danh sách chi tiết các cuộc gọi và phí tính toán
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Extension</th>
                      <th className="text-left p-2">Loại</th>
                      <th className="text-left p-2">Đích đến</th>
                      <th className="text-left p-2">Thời lượng</th>
                      <th className="text-left p-2">Chi phí</th>
                      <th className="text-left p-2">Ngày</th>
                      <th className="text-left p-2">Trạng thái</th>
                      <th className="text-left p-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingRecords.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{record.extension}</td>
                        <td className="p-2">
                          <Badge variant="outline">
                            {record.callType === 'outbound' ? 'Gọi ra' : 
                             record.callType === 'inbound' ? 'Gọi vào' : 'Nội bộ'}
                          </Badge>
                        </td>
                        <td className="p-2">{record.destination}</td>
                        <td className="p-2">{formatDuration(record.duration)}</td>
                        <td className="p-2 font-medium">{formatCurrency(record.cost)}</td>
                        <td className="p-2">{new Date(record.date).toLocaleDateString('vi-VN')}</td>
                        <td className="p-2">{getStatusBadge(record.status)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hóa đơn</CardTitle>
                  <CardDescription>
                    Quản lý hóa đơn và thanh toán
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo hóa đơn mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Số hóa đơn</th>
                      <th className="text-left p-2">Extension</th>
                      <th className="text-left p-2">Kỳ</th>
                      <th className="text-left p-2">Cuộc gọi</th>
                      <th className="text-left p-2">Tổng tiền</th>
                      <th className="text-left p-2">Hạn thanh toán</th>
                      <th className="text-left p-2">Trạng thái</th>
                      <th className="text-left p-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{invoice.invoiceNumber}</td>
                        <td className="p-2">{invoice.extension}</td>
                        <td className="p-2">{invoice.period}</td>
                        <td className="p-2">{invoice.totalCalls}</td>
                        <td className="p-2 font-medium">{formatCurrency(invoice.totalCost)}</td>
                        <td className="p-2">{new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</td>
                        <td className="p-2">{getStatusBadge(invoice.status)}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
