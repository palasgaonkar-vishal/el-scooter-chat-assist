import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface ResolutionCardProps {
  escalation: {
    id: string;
    query: string;
    resolution: string | null;
    status: 'pending' | 'in_progress' | 'resolved' | 'closed';
    escalated_at: string;
    resolved_at: string | null;
    admin_notes: string | null;
    assigned_admin_id: string | null;
  };
  onMarkAsRead?: () => void;
}

export const ResolutionCard = ({ escalation, onMarkAsRead }: ResolutionCardProps) => {
  const getStatusIcon = () => {
    switch (escalation.status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (escalation.status) {
      case 'resolved':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <Card className={`transition-all duration-300 ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon()}
            Support Response
          </CardTitle>
          <Badge variant={escalation.status === 'resolved' ? 'default' : 'secondary'}>
            {escalation.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Your Query:</p>
          <p className="text-sm bg-background/50 p-2 rounded border">
            {escalation.query}
          </p>
        </div>

        {escalation.resolution && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Admin Response:</p>
            <p className="text-sm bg-white p-3 rounded border border-green-200">
              {escalation.resolution}
            </p>
          </div>
        )}

        {escalation.admin_notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Additional Notes:</p>
            <p className="text-xs text-muted-foreground bg-background/50 p-2 rounded border">
              {escalation.admin_notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Escalated: {format(new Date(escalation.escalated_at), 'MMM d, h:mm a')}
          </span>
          {escalation.resolved_at && (
            <span>
              Resolved: {format(new Date(escalation.resolved_at), 'MMM d, h:mm a')}
            </span>
          )}
        </div>

        {escalation.status === 'resolved' && onMarkAsRead && (
          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={onMarkAsRead} className="w-full">
              Mark as Read
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};