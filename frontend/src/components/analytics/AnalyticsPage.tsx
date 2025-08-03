'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Phone, 
  Users, 
  Calendar,
  Download,
  RefreshCw,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';

interface CallMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageDuration: number;
  peakHour: string;
  busyDay: string;
}

interface AnalyticsData {
  overview: CallMetrics;
  hourlyStats: Array<{ hour: string; calls: number; duration: number }>;
  dailyStats: Array<{ date: string; calls: number; success_rate: number }>;
  topExtensions: Array<{ extension: string; calls: number; duration: number }>;
  callTypes: Array<{ type: string; count: number; percentage: number }>;
}

export function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        overview: {
          totalCalls: 1247,
          successfulCalls: 1156,
          failedCalls: 91,
          averageDuration: 185, // seconds
          peakHour: '14:00',
          busyDay: 'Tuesday'
        },
        hourlyStats: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          calls: Math.floor(Math.random() * 100) + 10,
          duration: Math.floor(Math.random() * 300) + 60
        })),
        dailyStats: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          calls: Math.floor(Math.random() * 200) + 50,
          success_rate: Math.floor(Math.random() * 20) + 80
        })),
        topExtensions: [
          { extension: '1001', calls: 156, duration: 12450 },
          { extension: '1002', calls: 134, duration: 10890 },
          { extension: '1003', calls: 98, duration: 8760 },
          { extension: '1004', calls: 87, duration: 7650 },
          { extension: '1005', calls: 76, duration: 6540 }
        ],
        callTypes: [
          { type: 'Internal', count: 687, percentage: 55.1 },
          { type: 'Outbound', count: 398, percentage: 31.9 },
          { type: 'Inbound', count: 162, percentage: 13.0 }
        ]
      };
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [dateRange]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Đang tải dữ liệu analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Không có dữ liệu</h3>
          <p className="text-muted-foreground">Chưa có dữ liệu analytics để hiển thị.</p>
        </div>
      </div>
    );
  }

  const { overview } = analyticsData;
  const successRate = ((overview.successfulCalls / overview.totalCalls) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Analytics</h1>
          <p className="text-muted-foreground">
            Phân tích chi tiết về hoạt động cuộc gọi và hiệu suất hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1d">24 giờ qua</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="90d">90 ngày qua</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng cuộc gọi</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% so với kỳ trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {overview.successfulCalls}/{overview.totalCalls} cuộc gọi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời lượng TB</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(overview.averageDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Trung bình mỗi cuộc gọi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giờ cao điểm</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.peakHour}</div>
            <p className="text-xs text-muted-foreground">
              Ngày bận nhất: {overview.busyDay}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="trends">Xu hướng</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="types">Loại cuộc gọi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Thống kê theo giờ
                </CardTitle>
                <CardDescription>
                  Phân bố cuộc gọi trong 24 giờ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <LineChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Biểu đồ thống kê theo giờ</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tích hợp chart library để hiển thị dữ liệu
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Phân loại cuộc gọi
                </CardTitle>
                <CardDescription>
                  Tỷ lệ các loại cuộc gọi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.callTypes.map((type, index) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 'bg-orange-500'
                        }`} />
                        <span className="text-sm">{type.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{type.count}</span>
                        <Badge variant="secondary">{type.percentage}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng theo ngày</CardTitle>
              <CardDescription>
                Thống kê cuộc gọi và tỷ lệ thành công 7 ngày qua
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Biểu đồ xu hướng</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tích hợp chart library để hiển thị xu hướng theo thời gian
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extensions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Extensions
              </CardTitle>
              <CardDescription>
                Extensions có nhiều cuộc gọi nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.topExtensions.map((ext, index) => (
                  <div key={ext.extension} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">Extension {ext.extension}</p>
                        <p className="text-sm text-muted-foreground">
                          {ext.calls} cuộc gọi
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatDuration(ext.duration)}</p>
                      <p className="text-sm text-muted-foreground">
                        TB: {formatTime(Math.floor(ext.duration / ext.calls))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết loại cuộc gọi</CardTitle>
              <CardDescription>
                Phân tích chi tiết theo từng loại cuộc gọi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analyticsData.callTypes.map((type, index) => (
                  <div key={type.type} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{type.type}</h3>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {type.percentage}%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold mb-1">{type.count}</p>
                    <p className="text-sm text-muted-foreground">cuộc gọi</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
