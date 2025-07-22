
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, User, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useUpdateEscalation, useResolveEscalation } from "@/hooks/useEscalation";
import type { Database } from "@/integrations/supabase/types";

type EscalatedQuery = Database['public']['Tables']['escalated_queries']['Row'];
type EscalationPriority = Database['public']['Enums']['escalation_priority'];
type EscalationStatus = Database['public']['Enums']['escalation_status'];

interface EscalationCardProps {
  escalation: EscalatedQuery & {
    profiles?: {
      name: string | null;
      email: string | null;
      mobile_number: string | null;
    } | null;
    chat_conversations?: {
      query: string;
      response: string | null;
      file_urls: string[] | null;
      created_at: string | null;
    } | null;
  };
  isAdmin?: boolean;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export const EscalationCard = ({ escalation, isAdmin = false }: EscalationCardProps) => {
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState(escalation.admin_notes || '');
  const [selectedStatus, setSelectedStatus] = useState<EscalationStatus>(escalation.status || 'pending');
  const [selectedPriority, setSelectedPriority] = useState<EscalationPriority>(escalation.priority || 'medium');

  const updateEscalation = useUpdateEscalation();
  const resolveEscalation = useResolveEscalation();

  const handleStatusUpdate = async (status: EscalationStatus) => {
    await updateEscalation.mutateAsync({
      id: escalation.id,
      updates: { status }
    });
    setSelectedStatus(status);
  };

  const handlePriorityUpdate = async (priority: EscalationPriority) => {
    await updateEscalation.mutateAsync({
      id: escalation.id,
      updates: { priority }
    });
    setSelectedPriority(priority);
  };

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    
    await resolveEscalation.mutateAsync({
      id: escalation.id,
      resolution,
      adminNotes: adminNotes || undefined,
    });
    
    setResolution('');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="break-all">Escalated Query #{escalation.id.slice(-8)}</span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityColors[escalation.priority || 'medium']}>
              {escalation.priority?.toUpperCase()}
            </Badge>
            <Badge className={statusColors[escalation.status || 'pending']}>
              {escalation.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDate(escalation.escalated_at)}
          </div>
          {escalation.profiles && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span className="break-words">{escalation.profiles.name || escalation.profiles.email || 'Unknown User'}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Original Query */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Original Query
          </h4>
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm">{escalation.query}</p>
          </div>
        </div>

        {/* Chat Context if available */}
        {escalation.chat_conversations && (
          <div>
            <h4 className="font-medium mb-2">Chat Context</h4>
            <div className="space-y-2">
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium text-blue-900">User:</p>
                <p className="text-sm">{escalation.chat_conversations.query}</p>
              </div>
              {escalation.chat_conversations.response && (
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-green-900">Bot Response:</p>
                  <p className="text-sm">{escalation.chat_conversations.response}</p>
                </div>
              )}
              {escalation.chat_conversations.file_urls && escalation.chat_conversations.file_urls.length > 0 && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm font-medium mb-2">Attached Files:</p>
                  <div className="space-y-1">
                    {escalation.chat_conversations.file_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        File {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={handleStatusUpdate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={selectedPriority} onValueChange={handlePriorityUpdate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Admin Notes</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes for this escalation..."
                className="min-h-20"
              />
            </div>

            {escalation.status !== 'resolved' && escalation.status !== 'closed' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution</label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Provide resolution for the customer..."
                  className="min-h-24"
                />
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <Button
                    onClick={handleResolve}
                    disabled={!resolution.trim() || resolveEscalation.isPending}
                    size="sm"
                  >
                    {resolveEscalation.isPending ? 'Resolving...' : 'Resolve Query'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resolution Display */}
        {escalation.resolution && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 text-green-700">Resolution</h4>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm">{escalation.resolution}</p>
              {escalation.resolved_at && (
                <p className="text-xs text-green-600 mt-2">
                  Resolved on {formatDate(escalation.resolved_at)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Admin Notes Display */}
        {escalation.admin_notes && !isAdmin && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Notes</h4>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">{escalation.admin_notes}</p>
            </div>
          </div>
         )}
      </CardContent>
    </Card>
  );
};
