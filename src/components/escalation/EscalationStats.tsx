
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useEscalationStats } from "@/hooks/useEscalation";

export const EscalationStats = () => {
  const { data: stats, isLoading } = useEscalationStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Queries",
      value: stats.total,
      icon: AlertTriangle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "In Progress",
      value: stats.in_progress,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Resolved",
      value: stats.resolved,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const priorityStats = [
    { label: "Critical", value: stats.critical, color: "bg-red-100 text-red-800" },
    { label: "High", value: stats.high, color: "bg-orange-100 text-orange-800" },
    { label: "Medium", value: stats.medium, color: "bg-yellow-100 text-yellow-800" },
    { label: "Low", value: stats.low, color: "bg-green-100 text-green-800" },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Priority Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {priorityStats.map((priority) => (
              <Badge key={priority.label} className={priority.color}>
                {priority.label}: {priority.value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resolution Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Resolution Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Resolved Queries</span>
              <span className="font-medium">
                {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: stats.total > 0 ? `${(stats.resolved / stats.total) * 100}%` : '0%'
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
