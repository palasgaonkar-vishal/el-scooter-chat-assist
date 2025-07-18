
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Clock, User, AlertTriangle } from "lucide-react";

const EscalatedQueries = () => {
  // Sample escalated queries data
  const queries = [
    {
      id: 1,
      customerName: "Rajesh Kumar",
      customerId: "#12345",
      query: "My scooter battery is not charging properly even after following all troubleshooting steps.",
      similarity: 65,
      escalatedAt: "2 hours ago",
      priority: "High",
      status: "Pending",
      attachments: ["battery_photo.jpg"],
    },
    {
      id: 2,
      customerName: "Priya Sharma",
      customerId: "#12346",
      query: "Need to schedule service appointment but no slots available in my city.",
      similarity: 58,
      escalatedAt: "4 hours ago",
      priority: "Medium",
      status: "In Progress",
      attachments: [],
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "default";
      case "Low": return "secondary";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escalated Queries</h1>
          <p className="text-muted-foreground">
            Handle customer queries that need manual attention
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Escalated</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Needs immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              Within SLA target
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {queries.map((query) => (
          <Card key={query.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{query.customerName}</span>
                    <span className="text-sm text-muted-foreground">
                      {query.customerId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(query.priority)}>
                      {query.priority} Priority
                    </Badge>
                    <Badge variant="outline">
                      {query.similarity}% Similarity
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Escalated {query.escalatedAt}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{query.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Query:</h4>
                  <p className="text-muted-foreground">{query.query}</p>
                </div>
                
                {query.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Attachments:</h4>
                    <div className="flex gap-2">
                      {query.attachments.map((attachment, index) => (
                        <Badge key={index} variant="outline">
                          {attachment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline">View Chat History</Button>
                  <Button>Respond to Customer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EscalatedQueries;
