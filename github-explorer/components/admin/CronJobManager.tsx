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
  // Removed useSQLite flag
}

export function CronJobManager({}: CronJobManagerProps) {
  const [activeTab, setActiveTab] = useState(PIPELINE_TYPES[0].id);
  const [cronExpression, setCronExpression] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use the cron jobs hook
  const { 
    cronJobs, 
    isLoading, 
    error,
    createOrUpdateCronJob,
    toggleCronJobStatus
  } = useCronJobs();
  
  // Find the current job for the active tab
  const currentJob = cronJobs.find(job => job.pipeline_type === activeTab);
  
  // Update the form when the tab changes
  useEffect(() => {
    if (currentJob) {
      setCronExpression(currentJob.cron_expression || '');
      setIsActive(currentJob.is_active || false);
    } else {
      // Default values for a new job
      setCronExpression('0 0 * * *'); // Daily at midnight
      setIsActive(true);
    }
  }, [activeTab, currentJob]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleSaveSchedule = async () => {
    try {
      setIsProcessing(true);
      
      const jobData = {
        pipeline_type: activeTab,
        cron_expression: cronExpression,
        is_active: isActive
      };
      
      await createOrUpdateCronJob.mutateAsync(jobData);
      
      toast.success(currentJob ? 'Schedule updated successfully' : 'New schedule created successfully');
    } catch (err) {
      console.error('Error saving schedule:', err);
      toast.error('Failed to save schedule');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleToggleStatus = async (newIsActive: boolean) => {
    if (!currentJob) return;
    
    try {
      setIsProcessing(true);
      
      await toggleCronJobStatus.mutateAsync({
        pipeline_type: activeTab,
        is_active: newIsActive
      });
      
      setIsActive(newIsActive);
      
      toast.success(
        newIsActive ? 
          'Schedule activated successfully' : 
          'Schedule deactivated successfully'
      );
    } catch (err) {
      console.error('Error toggling status:', err);
      toast.error('Failed to update schedule status');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getNextRunText = (expression: string) => {
    try {
      // This is just a placeholder - in a real app we would calculate the next run time
      return 'Soon';
    } catch (e) {
      return 'Invalid schedule';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pipeline Schedules</CardTitle>
        <CardDescription>Set up automated schedules for pipeline execution</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs 
          defaultValue={PIPELINE_TYPES[0].id} 
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="grid grid-cols-4 mb-4">
            {PIPELINE_TYPES.map(type => (
              <TabsTrigger key={type.id} value={type.id}>
                {type.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-4 text-destructive">
              Error loading schedules: {error.message}
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="cron-expression">Cron Expression</Label>
                  <Input
                    id="cron-expression"
                    placeholder="e.g. 0 0 * * *"
                    value={cronExpression}
                    onChange={e => setCronExpression(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: minute hour day-of-month month day-of-week
                  </p>
                  {cronExpression && (
                    <p className="text-xs">
                      Next run: {getNextRunText(cronExpression)}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">All Scheduled Jobs</h3>
                {cronJobs && cronJobs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pipeline</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Run</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cronJobs.map((job: CronJob) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            {PIPELINE_TYPES.find(p => p.id === job.pipeline_type)?.name || job.pipeline_type}
                          </TableCell>
                          <TableCell>{job.cron_expression}</TableCell>
                          <TableCell>
                            <Badge variant={job.is_active ? "success" : "secondary"}>
                              {job.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {job.updated_at ? formatDistanceToNow(new Date(job.updated_at), { addSuffix: true }) : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No scheduled jobs yet.</p>
                )}
              </div>
            </>
          )}
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          {currentJob && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(!isActive)}
                disabled={isProcessing || toggleCronJobStatus.isPending}
              >
                {isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Enable
                  </>
                )}
              </Button>
            </>
          )}
        </div>
        
        <Button 
          onClick={handleSaveSchedule}
          disabled={isProcessing || createOrUpdateCronJob.isPending || !cronExpression}
        >
          {isProcessing || createOrUpdateCronJob.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Schedule
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 