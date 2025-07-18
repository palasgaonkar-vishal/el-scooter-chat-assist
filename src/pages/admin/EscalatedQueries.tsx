
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { useEscalatedQueries } from "@/hooks/useEscalation";
import { EscalationCard } from "@/components/escalation/EscalationCard";
import { EscalationStats } from "@/components/escalation/EscalationStats";
import type { Database } from "@/integrations/supabase/types";

type EscalationStatus = Database['public']['Enums']['escalation_status'];

const EscalatedQueries = () => {
  const [selectedStatus, setSelectedStatus] = useState<EscalationStatus | 'all'>('all');

  const { data: allQueries, isLoading: isLoadingAll } = useEscalatedQueries();
  const { data: pendingQueries, isLoading: isLoadingPending } = useEscalatedQueries('pending');
  const { data: inProgressQueries, isLoading: isLoadingInProgress } = useEscalatedQueries('in_progress');
  const { data: resolvedQueries, isLoading: isLoadingResolved } = useEscalatedQueries('resolved');

  const getQueriesByStatus = () => {
    switch (selectedStatus) {
      case 'pending':
        return pendingQueries || [];
      case 'in_progress':
        return inProgressQueries || [];
      case 'resolved':
        return resolvedQueries || [];
      default:
        return allQueries || [];
    }
  };

  const isLoading = isLoadingAll || isLoadingPending || isLoadingInProgress || isLoadingResolved;
  const queries = getQueriesByStatus();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Escalated Queries</h1>
        <p className="text-muted-foreground">
          Manage and respond to escalated customer queries
        </p>
      </div>

      {/* Statistics */}
      <EscalationStats />

      {/* Query Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Query Management</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as EscalationStatus | 'all')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Queries</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                All ({allQueries?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingQueries?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                In Progress ({inProgressQueries?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved ({resolvedQueries?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <QueryList queries={allQueries || []} isLoading={isLoadingAll} />
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <QueryList queries={pendingQueries || []} isLoading={isLoadingPending} />
            </TabsContent>

            <TabsContent value="in_progress" className="mt-6">
              <QueryList queries={inProgressQueries || []} isLoading={isLoadingInProgress} />
            </TabsContent>

            <TabsContent value="resolved" className="mt-6">
              <QueryList queries={resolvedQueries || []} isLoading={isLoadingResolved} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface QueryListProps {
  queries: any[];
  isLoading: boolean;
}

const QueryList = ({ queries, isLoading }: QueryListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (queries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No queries found</h3>
          <p className="text-muted-foreground">
            There are no escalated queries matching the current filter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {queries.map((query) => (
        <EscalationCard key={query.id} escalation={query} isAdmin={true} />
      ))}
    </div>
  );
};

export default EscalatedQueries;
