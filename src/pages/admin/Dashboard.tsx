
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const AdminDashboard = () => {
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor support activities and system performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor support activities and system performance
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Failed to load dashboard metrics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-purple-100 text-purple-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
      default: return 'Normal';
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor support activities and system performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.hourlyChange.users > 0 ? '+' : ''}{metrics.hourlyChange.users}% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeChatSessions}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.hourlyChange.sessions > 0 ? '+' : ''}{metrics.hourlyChange.sessions}% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.escalatedQueries.total}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.escalatedQueries.pending} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FAQ Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.faqHitRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.faqHitRate >= 70 ? 'Above' : 'Below'} 70% threshold
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Escalations</CardTitle>
            <CardDescription>Queries that need admin attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentEscalations.length > 0 ? (
                metrics.recentEscalations.map((escalation) => (
                  <div key={escalation.id} className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                      <p className="font-medium truncate">
                        {escalation.query.length > 50 
                          ? `${escalation.query.substring(0, 50)}...` 
                          : escalation.query
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(escalation.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(escalation.priority)}`}>
                      {getPriorityLabel(escalation.priority)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent escalations</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">FAQ Matching Service</span>
                <span className={`text-sm ${metrics.systemHealth.faqService ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.systemHealth.faqService ? '✓ Operational' : '✗ Error'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Chat System</span>
                <span className={`text-sm ${metrics.systemHealth.chatSystem ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.systemHealth.chatSystem ? '✓ Operational' : '✗ Error'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">File Upload Service</span>
                <span className={`text-sm ${metrics.systemHealth.fileUpload ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.systemHealth.fileUpload ? '✓ Operational' : '✗ Error'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Database</span>
                <span className={`text-sm ${metrics.systemHealth.database ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.systemHealth.database ? '✓ Operational' : '✗ Error'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
