
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Eye, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { useFAQManagement } from '@/hooks/useFAQManagement';
import { FAQ_CATEGORIES } from '@/hooks/useFAQManagement';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const FAQAnalytics: React.FC = () => {
  const { useFAQAnalytics } = useFAQManagement();
  const { data, isLoading, error } = useFAQAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Failed to load FAQ analytics</p>
        </CardContent>
      </Card>
    );
  }

  const { faqs, analytics } = data;

  // Prepare data for charts
  const categoryData = FAQ_CATEGORIES.map(category => {
    const categoryFAQs = faqs.filter(faq => faq.category === category.value);
    const totalViews = categoryFAQs.reduce((sum, faq) => sum + (faq.view_count || 0), 0);
    const totalHelpful = categoryFAQs.reduce((sum, faq) => sum + (faq.helpful_count || 0), 0);
    const totalNotHelpful = categoryFAQs.reduce((sum, faq) => sum + (faq.not_helpful_count || 0), 0);
    
    return {
      name: category.label,
      count: categoryFAQs.length,
      views: totalViews,
      helpful: totalHelpful,
      notHelpful: totalNotHelpful,
      helpfulnessRate: totalHelpful + totalNotHelpful > 0 
        ? Math.round((totalHelpful / (totalHelpful + totalNotHelpful)) * 100) 
        : 0
    };
  });

  const topFAQs = faqs
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total FAQs</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFAQs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Helpful Votes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.totalHelpful}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Helpfulness</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgHelpfulnessRate}%</div>
            <Progress 
              value={analytics.avgHelpfulnessRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>FAQ Distribution by Category</CardTitle>
            <CardDescription>Number of FAQs in each category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, count }) => `${name}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Views and helpfulness by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#8884d8" name="Views" />
                <Bar dataKey="helpful" fill="#82ca9d" name="Helpful" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing FAQs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing FAQs</CardTitle>
          <CardDescription>Most viewed FAQs with performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topFAQs.map((faq, index) => {
              const totalFeedback = (faq.helpful_count || 0) + (faq.not_helpful_count || 0);
              const helpfulnessRate = totalFeedback > 0 
                ? Math.round(((faq.helpful_count || 0) / totalFeedback) * 100) 
                : 0;
              
              return (
                <div key={faq.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <Badge variant="secondary">
                        {FAQ_CATEGORIES.find(cat => cat.value === faq.category)?.label || faq.category}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2">{faq.question}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {faq.view_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {faq.helpful_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3" />
                        {faq.not_helpful_count || 0}
                      </span>
                      <span>{helpfulnessRate}% helpful</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Progress value={helpfulnessRate} className="w-20" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQAnalytics;
