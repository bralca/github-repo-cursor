import { Metadata } from 'next';
import { PipelineControlCard } from '@/components/admin/PipelineControlCard';
import { CronJobManager } from '@/components/admin/CronJobManager';
import { EntityStatsOverview } from '@/components/admin/EntityStatsOverview';
import { PipelineHistory } from '@/components/admin/PipelineHistory';
import { ErrorNotification } from '@/components/admin/ErrorNotification';
import { ServerConfigurationAlert } from '@/components/admin/ServerConfigurationAlert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Admin Dashboard | GitHub Explorer',
  description: 'Manage pipeline operations and monitor system status',
};

export default function AdminDashboardPage() {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pipeline Control Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and control different stages of the data processing pipeline
          </p>
        </div>
        
        <ErrorNotification />
        <ServerConfigurationAlert />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PipelineControlCard 
            pipelineType="github_sync" 
            title="Closed Merge Requests" 
            description="Pull new raw data from recent merge requests" 
          />
          <PipelineControlCard 
            pipelineType="data_processing" 
            title="Pending Entity Extraction" 
            description="Process raw GitHub data into entities" 
          />
          <PipelineControlCard 
            pipelineType="data_enrichment" 
            title="Pending Entity Enrichment" 
            description="Enrich extracted entities with details" 
          />
          <PipelineControlCard 
            pipelineType="ai_analysis" 
            title="Pending AI Analysis" 
            description="Analyze data with AI for insights" 
          />
        </div>
        
        <Tabs defaultValue="entity-stats" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-3">
            <TabsTrigger value="entity-stats">Entity Stats</TabsTrigger>
            <TabsTrigger value="process-control">Process Control</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="entity-stats" className="mt-6">
            <EntityStatsOverview />
          </TabsContent>
          
          <TabsContent value="process-control" className="mt-6">
            <CronJobManager />
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <PipelineHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 