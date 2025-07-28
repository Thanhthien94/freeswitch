'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, Globe, Shield, Settings } from 'lucide-react';
import { UpdateNetworkConfigDto } from '@/services/network-config.service';

interface NetworkConfigFormProps {
  data: UpdateNetworkConfigDto;
  onChange: (data: UpdateNetworkConfigDto) => void;
  activeTab: string;
  isLoading?: boolean;
}

export function NetworkConfigForm({ data, onChange, activeTab, isLoading }: NetworkConfigFormProps) {
  const handleChange = (field: keyof UpdateNetworkConfigDto, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleArrayChange = (field: keyof UpdateNetworkConfigDto, value: string) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    onChange({ ...data, [field]: array });
  };

  return (
    <div className="space-y-6">
      {/* General Tab */}
      <TabsContent value="general" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4" />
              <h3 className="font-semibold">Nhận dạng mạng</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={data.domain || ''}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="localhost"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bindServerIp">Bind Server IP</Label>
              <Input
                id="bindServerIp"
                value={data.bindServerIp || ''}
                onChange={(e) => handleChange('bindServerIp', e.target.value)}
                placeholder="auto"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                IP để bind server. Sử dụng "auto" để tự động phát hiện.
              </p>
            </div>
          </div>

          {/* External Network */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="h-4 w-4" />
              <h3 className="font-semibold">Mạng external</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalIp">External IP</Label>
              <div className="flex gap-2">
                <Input
                  id="externalIp"
                  value={data.externalIp || ''}
                  onChange={(e) => handleChange('externalIp', e.target.value)}
                  placeholder="auto"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleChange('externalIp', 'auto')}
                  disabled={isLoading}
                >
                  Auto
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalRtpIp">External RTP IP</Label>
              <Input
                id="externalRtpIp"
                value={data.externalRtpIp || ''}
                onChange={(e) => handleChange('externalRtpIp', e.target.value)}
                placeholder="Để trống để sử dụng External IP"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* STUN Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4" />
            <h3 className="font-semibold">Cấu hình STUN</h3>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="stunEnabled"
              checked={data.stunEnabled || false}
              onCheckedChange={(checked) => handleChange('stunEnabled', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="stunEnabled">Bật STUN</Label>
          </div>

          {data.stunEnabled && (
            <div className="space-y-2">
              <Label htmlFor="stunServer">STUN Server</Label>
              <Input
                id="stunServer"
                value={data.stunServer || ''}
                onChange={(e) => handleChange('stunServer', e.target.value)}
                placeholder="stun:stun.freeswitch.org"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* NAT Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold">Cài đặt NAT</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="natDetection"
                checked={data.natDetection || false}
                onCheckedChange={(checked) => handleChange('natDetection', checked)}
                disabled={isLoading}
              />
              <Label htmlFor="natDetection">Phát hiện NAT</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoNat"
                checked={data.autoNat || false}
                onCheckedChange={(checked) => handleChange('autoNat', checked)}
                disabled={isLoading}
              />
              <Label htmlFor="autoNat">Auto NAT</Label>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Ports Tab */}
      <TabsContent value="ports" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SIP Ports */}
          <div className="space-y-4">
            <h3 className="font-semibold">Cổng SIP</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sipPort">SIP Port (Internal)</Label>
              <Input
                id="sipPort"
                type="number"
                value={data.sipPort || 5060}
                onChange={(e) => handleChange('sipPort', parseInt(e.target.value))}
                min="1"
                max="65535"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalSipPort">SIP Port (External)</Label>
              <Input
                id="externalSipPort"
                type="number"
                value={data.externalSipPort || ''}
                onChange={(e) => handleChange('externalSipPort', e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                max="65535"
                placeholder="Để trống để sử dụng SIP Port"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* TLS Ports */}
          <div className="space-y-4">
            <h3 className="font-semibold">Cổng TLS</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tlsPort">TLS Port (Internal)</Label>
              <Input
                id="tlsPort"
                type="number"
                value={data.tlsPort || 5061}
                onChange={(e) => handleChange('tlsPort', parseInt(e.target.value))}
                min="1"
                max="65535"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="externalTlsPort">TLS Port (External)</Label>
              <Input
                id="externalTlsPort"
                type="number"
                value={data.externalTlsPort || ''}
                onChange={(e) => handleChange('externalTlsPort', e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                max="65535"
                placeholder="Để trống để sử dụng TLS Port"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* RTP Ports */}
        <div className="space-y-4">
          <h3 className="font-semibold">Dải cổng RTP</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rtpStartPort">RTP Start Port</Label>
              <Input
                id="rtpStartPort"
                type="number"
                value={data.rtpStartPort || 16384}
                onChange={(e) => handleChange('rtpStartPort', parseInt(e.target.value))}
                min="1024"
                max="65535"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rtpEndPort">RTP End Port</Label>
              <Input
                id="rtpEndPort"
                type="number"
                value={data.rtpEndPort || 16484}
                onChange={(e) => handleChange('rtpEndPort', parseInt(e.target.value))}
                min="1024"
                max="65535"
                disabled={isLoading}
              />
            </div>
          </div>

          {data.rtpStartPort && data.rtpEndPort && (
            <div className="text-sm text-muted-foreground">
              Số cổng RTP: {data.rtpEndPort - data.rtpStartPort + 1} cổng
              {data.rtpEndPort - data.rtpStartPort < 100 && (
                <Badge variant="secondary" className="ml-2">
                  Cảnh báo: Ít hơn 100 cổng
                </Badge>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Codecs Tab */}
      <TabsContent value="codecs" className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Cấu hình Codec</h3>
          
          <div className="space-y-2">
            <Label htmlFor="globalCodecPrefs">Global Codec Preferences</Label>
            <Input
              id="globalCodecPrefs"
              value={data.globalCodecPrefs || ''}
              onChange={(e) => handleChange('globalCodecPrefs', e.target.value)}
              placeholder="OPUS,G722,PCMU,PCMA"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Danh sách codec ưu tiên, phân cách bằng dấu phẩy
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outboundCodecPrefs">Outbound Codec Preferences</Label>
            <Input
              id="outboundCodecPrefs"
              value={data.outboundCodecPrefs || ''}
              onChange={(e) => handleChange('outboundCodecPrefs', e.target.value)}
              placeholder="OPUS,G722,PCMU,PCMA"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Codec ưu tiên cho cuộc gọi đi
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Advanced Tab */}
      <TabsContent value="advanced" className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Cài đặt nâng cao</h3>
          
          <div className="space-y-2">
            <Label htmlFor="transportProtocols">Transport Protocols</Label>
            <Input
              id="transportProtocols"
              value={data.transportProtocols?.join(',') || ''}
              onChange={(e) => handleArrayChange('transportProtocols', e.target.value)}
              placeholder="udp,tcp"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Các giao thức transport được hỗ trợ, phân cách bằng dấu phẩy
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enableTls"
              checked={data.enableTls || false}
              onCheckedChange={(checked) => handleChange('enableTls', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="enableTls">Bật TLS</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="autoApply"
              checked={data.autoApply || false}
              onCheckedChange={(checked) => handleChange('autoApply', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="autoApply">Tự động áp dụng thay đổi</Label>
          </div>
        </div>
      </TabsContent>
    </div>
  );
}
