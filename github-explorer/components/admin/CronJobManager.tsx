'use client';

import { useState, useEffect } from 'react';
import { useCronJobs, CronJob } from '@/hooks/admin/use-cron-jobs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, Pause, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSQLitePipelineSchedules } from '@/hooks/admin/use-sqlite-pipeline-schedules';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const PIPELINE_TYPES = [
  { id: 'github_sync', name: 'GitHub Sync' },
  { id: 'data_processing', name: 'Data Processing' },
  { id: 'data_enrichment', name: 'Data Enrichment' },
  { id: 'ai_analysis', name: 'AI Analysis' }
];

interface CronJobManagerProps {
  useSQLite: boolean;
}

export function CronJobManager({ useSQLite }: CronJobManagerProps) {
  const [activeTab, setActiveTab] = useState(PIPELINE_TYPES[0].id);
  const [cronExpression, setCronExpression] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    cronJobs, 
    isLoading, 
    error, 
    createOrUpdateCronJob, 
    toggleCronJobStatus 
  } = useCronJobs(activeTab);
  
  const currentCronJob = cronJobs.length > 0 ? cronJobs[0] : null;
  
  // Set initial cron expression when job is loaded
  useEffect(() => {
    if (currentCronJob?.cron_expression && !cronExpression) {
      setCronExpression(currentCronJob.cron_expression);
    }
  }, [currentCronJob, cronExpression]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCronExpression(''); // Reset cron expression when changing tabs
  };
  
  const handleSaveSchedule = async () => {
    if (!cronExpression.trim()) {
      toast.error('Please enter a valid cron expression');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createOrUpdateCronJob.mutateAsync({
        pipeline_type: activeTab,
        cron_expression: cronExpression,
      });
      
      toast.success('Schedule saved successfully');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleToggleStatus = async (isActive: boolean) => {
    try {
      await toggleCronJobStatus.mutateAsync({
        pipeline_type: activeTab,
        is_active: isActive,
      });
      
      toast.success(`Pipeline ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update pipeline status');
    }
  };
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Pipeline Schedule Management</CardTitle>
          <CardDescription>Error loading pipeline schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            Failed to load pipeline schedules. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pipeline Schedule Management</CardTitle>
        <CardDescription>
          Configure and manage cron schedules for pipeline jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 mb-6">
            {PIPELINE_TYPES.map((type) => (
              <TabsTrigger key={type.id} value={type.id}>
                {type.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {PIPELINE_TYPES.map((type) => (
            <TabsContent key={type.id} value={type.id} className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{type.name} Pipeline</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentCronJob?.is_active 
                            ? 'Currently active and running on schedule' 
                            : 'Currently inactive'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={currentCronJob?.is_active || false}
                          onCheckedChange={handleToggleStatus}
                          disabled={!currentCronJob || toggleCronJobStatus.isPending}
                        />
                        <span className="text-sm">
                          {currentCronJob?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cron-expression">Cron Schedule</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="cron-expression"
                        placeholder="*/10 * * * *"
                        value={cronExpression || currentCronJob?.cron_expression || ''}
                        onChange={(e) => setCronExpression(e.target.value)}
                      />
                      <Button 
                        onClick={handleSaveSchedule}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use cron syntax (e.g., "*/10 * * * *" for every 10 minutes)
                    </p>
                  </div>
                  
                  {currentCronJob && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Schedule Information</h4>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Last Updated</dt>
                        <dd>
                          {new Date(currentCronJob.updated_at).toLocaleString()}
                        </dd>
                        <dt className="text-muted-foreground">Created</dt>
                        <dd>
                          {new Date(currentCronJob.created_at).toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Changes to schedules take effect immediately
        </p>
      </CardFooter>
    </Card>
  );
} 