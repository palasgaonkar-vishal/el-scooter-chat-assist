import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquareWarning } from "lucide-react";
import { useAdminEscalationNotifications } from "@/hooks/useNotifications";

export const AdminNotificationStatus = () => {
  const { pendingCount, newEscalationCount } = useAdminEscalationNotifications();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notification Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4" />
            Pending Escalations
          </span>
          <Badge variant={pendingCount > 0 ? "destructive" : "secondary"}>
            {pendingCount}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            New Notifications
          </span>
          <Badge variant={newEscalationCount > 0 ? "destructive" : "secondary"}>
            {newEscalationCount}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};