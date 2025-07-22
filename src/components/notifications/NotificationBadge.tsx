import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  max?: number;
}

export const NotificationBadge = ({ count, className, max = 99 }: NotificationBadgeProps) => {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "absolute -top-1 -right-1 min-w-[1.2rem] h-5 text-xs flex items-center justify-center px-1 animate-pulse",
        className
      )}
    >
      {displayCount}
    </Badge>
  );
};