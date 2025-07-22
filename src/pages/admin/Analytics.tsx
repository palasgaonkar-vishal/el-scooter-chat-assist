
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Skeleton } from "@/components/ui/skeleton";

const Analytics = () => {
  const [period, setPeriod] = useState<'24hours' | '7days' | '30days' | '90days'>('7days');
  const { data: analyticsData, isLoading, error } = useAnalytics(period);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Insights into support performance and user behavior
            </p>
          </div>
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

  if (error || !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              Insights into support performance and user behavior
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Failed to load analytics data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights into support performance and user behavior
          </p>
        </div>
        
        <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24hours">Last 24 Hours</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalChats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.weeklyChange.chats > 0 ? '+' : ''}{analyticsData.weeklyChange.chats}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.weeklyChange.resolution > 0 ? '+' : ''}{analyticsData.weeklyChange.resolution}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgResponseTime}min</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.weeklyChange.responseTime > 0 ? '+' : ''}{analyticsData.weeklyChange.responseTime}s from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FAQ Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.faqHitRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.faqHitRate >= 70 ? 'Above' : 'Below'} 70% threshold
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="faq">FAQ Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Chat Volume Trends</CardTitle>
                <CardDescription>Daily chat volume and resolution rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.chatVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="chats" fill="#8884d8" />
                    <Bar dataKey="resolved" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Pattern</CardTitle>
                <CardDescription>Average response time throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgTime" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>FAQ Category Distribution</CardTitle>
                <CardDescription>Most searched FAQ categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                     <Pie
                       data={analyticsData.faqHitData}
                       cx="50%"
                       cy="50%"
                       labelLine={false}
                       label={({ name, percentage }) => `${name} ${percentage}%`}
                       outerRadius={80}
                       fill="#8884d8"
                       dataKey="hits"
                     >
                       {analyticsData.faqHitData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top FAQ Questions</CardTitle>
                <CardDescription>Most frequently matched questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topFAQQuestions.length > 0 ? (
                    analyticsData.topFAQQuestions.map((faq, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <p className="text-sm">{faq.question}</p>
                        <span className="text-sm font-medium">{faq.hits} hits</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No FAQ data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12ms</div>
                <p className="text-xs text-muted-foreground">Avg query time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">67%</div>
                <p className="text-xs text-muted-foreground">of allocated space</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
