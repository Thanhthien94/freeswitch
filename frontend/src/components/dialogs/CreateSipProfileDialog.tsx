'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sipProfileService, CreateSipProfileData } from '@/services/sip-profile.service';
import { domainService } from '@/services/domain.service';

// Form validation schema
const createSipProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['internal', 'external', 'custom']),
  domainId: z.string().optional(),
  bindIp: z.string().optional(),
  bindPort: z.number().min(1024, 'Port must be at least 1024').max(65535, 'Port must be less than 65536'),
  tlsPort: z.number().optional(),
  rtpIp: z.string().optional(),
  extRtpIp: z.string().optional(),
  extSipIp: z.string().optional(),
  sipPort: z.number().optional(),
  settings: z.any().optional(),
  advancedSettings: z.any().optional(),
  securitySettings: z.any().optional(),
  codecSettings: z.any().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  order: z.number().optional(),
});

type CreateSipProfileFormData = z.infer<typeof createSipProfileSchema>;

interface CreateSipProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSipProfileDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSipProfileDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<CreateSipProfileFormData>({
    resolver: zodResolver(createSipProfileSchema),
    defaultValues: {
      name: '',
      displayName: '',
      description: '',
      type: 'custom' as const,
      domainId: 'none',
      bindIp: '0.0.0.0',
      bindPort: 5060,
      rtpIp: '0.0.0.0',
      isActive: true,
      isDefault: false,
      order: 0,
    },
  });

  // Fetch domains for dropdown
  const { data: domainsResponse } = useQuery({
    queryKey: ['domains'],
    queryFn: () => domainService.getDomains(),
  });

  const domains = domainsResponse?.data || [];

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateSipProfileData) => sipProfileService.createSipProfile(data),
    onSuccess: () => {
      toast.success('SIP Profile created successfully');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create SIP Profile');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: CreateSipProfileFormData) => {
    setIsSubmitting(true);
    // Convert "none" to undefined for domainId
    const submitData = {
      ...data,
      domainId: data.domainId === 'none' ? undefined : data.domainId,
    };
    createMutation.mutate(submitData);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create SIP Profile</DialogTitle>
          <DialogDescription>
            Create a new SIP profile with custom configuration settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="internal" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the SIP profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Internal Profile" {...field} />
                      </FormControl>
                      <FormDescription>
                        Human-readable name for the profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select domain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Domain</SelectItem>
                          {domains.map((domain) => (
                            <SelectItem key={domain.id} value={domain.id}>
                              {domain.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Associate with a specific domain
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Profile description..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description for the profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Network Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Network Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bindIp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bind IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0.0.0.0" {...field} />
                      </FormControl>
                      <FormDescription>
                        IP address to bind the SIP profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bindPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bind Port *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5060"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Port to bind the SIP profile (default: 5060)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rtpIp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RTP IP Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0.0.0.0" {...field} />
                      </FormControl>
                      <FormDescription>
                        IP address for RTP media
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Profile'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
