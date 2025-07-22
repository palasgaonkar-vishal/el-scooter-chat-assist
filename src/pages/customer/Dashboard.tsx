
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Package, User, HelpCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserActivity } from "@/hooks/useUserActivity";

const Dashboard = () => {
  const { data: activities, isLoading: isActivitiesLoading } = useUserActivity();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageCircle className="h-4 w-4" />;
      case 'order':
        return <Package className="h-4 w-4" />;
      case 'escalation':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variant = status === 'completed' || status === 'delivered' || status === 'resolved' 
      ? 'default' 
      : status === 'pending' || status === 'processing'
      ? 'secondary'
      : 'destructive';
    
    return <Badge variant={variant} className="text-xs">{status}</Badge>;
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          How can we help you with your Ather experience today?
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Support</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Chat Now</div>
            <p className="text-xs text-muted-foreground">
              Get instant help from our AI assistant
            </p>
            <Link to="chat">
              <Button className="w-full mt-2" size="sm">
                Start Chat
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Status</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Track Order</div>
            <p className="text-xs text-muted-foreground">
              Check your order progress
            </p>
            <Link to="orders">
              <Button className="w-full mt-2" size="sm" variant="outline">
                View Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage</div>
            <p className="text-xs text-muted-foreground">
              Update your information
            </p>
            <Link to="profile">
              <Button className="w-full mt-2" size="sm" variant="outline">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Help Center</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">FAQs</div>
            <p className="text-xs text-muted-foreground">
              Find quick answers
            </p>
            <Link to="faq">
              <Button className="w-full mt-2" size="sm" variant="outline">
                Browse FAQs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest interactions with support</CardDescription>
          </CardHeader>
          <CardContent>
            {isActivitiesLoading ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Loading recent activity...</p>
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg border">
                    <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground">
                  Your support conversations and order updates will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common support requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/dashboard/chat?message=I'm experiencing an issue with my Ather scooter and need help with troubleshooting. Could you help me diagnose the problem?">
              <Button variant="ghost" className="w-full justify-start">
                Report a problem with my scooter
              </Button>
            </Link>
            <Link to="/dashboard/chat?message=I need to schedule a service appointment for my Ather scooter. Can you help me book a service slot?">
              <Button variant="ghost" className="w-full justify-start">
                Schedule service appointment
              </Button>
            </Link>
            <Link to="/dashboard/chat?message=I'm having battery performance issues with my Ather scooter. The range seems to be lower than expected and charging seems slower. Can you help?">
              <Button variant="ghost" className="w-full justify-start">
                Battery performance issues
              </Button>
            </Link>
            <Link to="/dashboard/chat?message=I need information about my Ather scooter warranty coverage. Can you help me understand what's covered and how to claim warranty?">
              <Button variant="ghost" className="w-full justify-start">
                Warranty information
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
