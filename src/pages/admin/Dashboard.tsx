
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageCircle, AlertTriangle, TrendingUp, UserPlus } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { createAdminUser } from "@/utils/createAdminUser";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const AdminDashboard = () => {
  const { data: metrics, isLoading, error } = useDashboardMetrics();
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateAdmin = async () => {
    if (!newAdminData.email || !newAdminData.password) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await createAdminUser(
        newAdminData.email,
        newAdminData.password,
        newAdminData.name || 'Admin User'
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        setIsCreateAdminOpen(false);
        setNewAdminData({ email: '', password: '', name: '' });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create admin user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monitor support activities and system performance
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
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
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Monitor support activities and system performance
          </p>
        </div>
        <Dialog open={isCreateAdminOpen} onOpenChange={setIsCreateAdminOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                Add a new admin user to the system. They will receive admin privileges immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-email">Email *</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@atherenergy.com"
                  value={newAdminData.email}
                  onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-password">Password *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter secure password"
                  value={newAdminData.password}
                  onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admin-name">Name (Optional)</Label>
                <Input
                  id="admin-name"
                  type="text"
                  placeholder="Admin User"
                  value={newAdminData.name}
                  onChange={(e) => setNewAdminData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateAdmin}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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
