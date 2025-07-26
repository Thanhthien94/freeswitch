'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Phone, 
  ChevronDown, 
  ChevronRight, 
  Edit, 
  Settings,
  Shield,
  CreditCard,
  Globe,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Domain } from '@/services/domain.service';

interface DomainHierarchyProps {
  domains: Domain[];
  onEditDomain: (domain: Domain) => void;
}

interface DomainNodeProps {
  domain: Domain;
  onEdit: (domain: Domain) => void;
  level?: number;
}

function DomainNode({ domain, onEdit, level = 0 }: DomainNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  // Calculate utilization
  const userUtilization = domain.maxUsers > 0 ? ((domain.users?.length || 0) / domain.maxUsers) * 100 : 0;
  const extensionUtilization = 0; // TODO: Get actual extension count

  // Get status color
  const getStatusColor = (): "default" | "destructive" | "outline" | "secondary" => {
    if (!domain.isActive) return 'secondary';
    if (userUtilization > 90) return 'destructive';
    if (userUtilization > 75) return 'secondary'; // Changed from 'warning' to 'secondary'
    return 'default';
  };

  return (
    <Card className={`transition-all duration-200 ${!domain.isActive ? 'opacity-75' : ''}`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{domain.displayName}</CardTitle>
                  <CardDescription className="text-sm">{domain.name}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor()}>
                  {domain.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(domain);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Description */}
            {domain.description && (
              <div>
                <p className="text-sm text-muted-foreground">{domain.description}</p>
              </div>
            )}

            {/* Resource Utilization */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Resource Utilization
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Users</span>
                    <span className="font-medium">
                      {domain.users?.length || 0} / {domain.maxUsers}
                    </span>
                  </div>
                  <Progress value={userUtilization} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {userUtilization.toFixed(1)}% utilized
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Extensions</span>
                    <span className="font-medium">
                      0 / {domain.maxExtensions}
                    </span>
                  </div>
                  <Progress value={extensionUtilization} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {extensionUtilization.toFixed(1)}% utilized
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Domain Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuration
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Concurrent Calls:</span>
                    <span className="font-medium">{(domain as any).maxConcurrentCalls || 50}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timezone:</span>
                    <span className="font-medium">{(domain as any).timezone || 'UTC'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Language:</span>
                    <span className="font-medium">{(domain as any).language || 'en'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Billing Plan:</span>
                    <Badge variant="outline" className="text-xs">
                      {domain.billingPlan || 'Basic'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost Center:</span>
                    <span className="font-medium">{domain.costCenter || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Features & Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Features & Security
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Call Features
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {domain.settings?.recording_enabled && (
                      <Badge variant="outline" className="text-xs">
                        Recording
                      </Badge>
                    )}
                    {domain.settings?.voicemail_enabled && (
                      <Badge variant="outline" className="text-xs">
                        Voicemail
                      </Badge>
                    )}
                    {!domain.settings?.recording_enabled && !domain.settings?.voicemail_enabled && (
                      <span className="text-xs text-muted-foreground">No features enabled</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Security Settings
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {domain.settings?.registration_required && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Registration Required
                      </Badge>
                    )}
                    {domain.settings?.allow_anonymous_calls && (
                      <Badge variant="outline" className="text-xs">
                        Anonymous Calls
                      </Badge>
                    )}
                    {!domain.settings?.registration_required && !domain.settings?.allow_anonymous_calls && (
                      <span className="text-xs text-muted-foreground">Default security</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Contact Information
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Admin Email:</span>
                    <div className="font-medium">{domain.adminEmail}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Admin Phone:</span>
                    <div className="font-medium">{domain.adminPhone || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gateway Configuration */}
            {(domain.settings?.default_gateway || domain.settings?.default_areacode) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Gateway Configuration
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {domain.settings?.default_gateway && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Default Gateway:</span>
                          <div className="font-medium">{domain.settings.default_gateway}</div>
                        </div>
                      </div>
                    )}

                    {domain.settings?.default_areacode && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Default Area Code:</span>
                          <div className="font-medium">{domain.settings.default_areacode}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function DomainHierarchy({ domains, onEditDomain }: DomainHierarchyProps) {
  // Group domains by status for better organization
  const activeDomains = domains.filter(domain => domain.isActive);
  const inactiveDomains = domains.filter(domain => !domain.isActive);

  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No domains found</h3>
          <p className="text-muted-foreground text-center">
            Create your first domain to see the hierarchical view.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Domains */}
      {activeDomains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Active Domains</h3>
            <Badge variant="default">{activeDomains.length}</Badge>
          </div>
          <div className="space-y-4">
            {activeDomains.map((domain) => (
              <DomainNode
                key={domain.id}
                domain={domain}
                onEdit={onEditDomain}
                level={0}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Domains */}
      {inactiveDomains.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Inactive Domains</h3>
            <Badge variant="secondary">{inactiveDomains.length}</Badge>
          </div>
          <div className="space-y-4">
            {inactiveDomains.map((domain) => (
              <DomainNode
                key={domain.id}
                domain={domain}
                onEdit={onEditDomain}
                level={0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
