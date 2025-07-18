
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useManualEscalation } from "@/hooks/useChat";

interface EscalationButtonProps {
  conversationId: string;
  query: string;
  disabled?: boolean;
}

export const EscalationButton = ({ conversationId, query, disabled }: EscalationButtonProps) => {
  const manualEscalation = useManualEscalation();

  const handleEscalate = async () => {  
    await manualEscalation.mutateAsync({
      conversationId,
      query,
      priority: 'medium',
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleEscalate}
      disabled={disabled || manualEscalation.isPending}
      className="text-orange-600 border-orange-200 hover:bg-orange-50"
    >
      <AlertTriangle className="h-4 w-4 mr-1" />
      {manualEscalation.isPending ? 'Escalating...' : 'Escalate to Support'}
    </Button>
  );
};
