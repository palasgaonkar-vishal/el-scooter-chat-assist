
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Grid, TrendingUp } from 'lucide-react';
import { FAQSearch } from '@/components/faq/FAQSearch';
import { FAQCategoryBrowser } from '@/components/faq/FAQCategoryBrowser';
import { useFAQs } from '@/hooks/useFAQ';
import { FAQCard } from '@/components/faq/FAQCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';

type FAQCategory = Database['public']['Enums']['faq_category'];

const FAQ = () => {
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | undefined>();
  const { data: popularFAQs, isLoading: popularLoading } = useFAQs({ limit: 10 });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about Ather scooters, charging, service, 
            and more. Use our smart search or browse by category.
          </p>
        </div>

        {/* FAQ Tabs */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Popular
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search FAQs</CardTitle>
                <CardDescription>
                  Enter your question or keywords to find the most relevant answers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FAQSearch />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Browse by Category</CardTitle>
                <CardDescription>
                  Select a category to view related frequently asked questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FAQCategoryBrowser
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Popular Tab */}
          <TabsContent value="popular" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular FAQs</CardTitle>
                <CardDescription>
                  The most viewed and helpful questions from our community
                </CardDescription>
              </CardHeader>
              <CardContent>
                {popularLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-5 w-3/4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-5 w-12" />
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : popularFAQs && popularFAQs.length > 0 ? (
                  <div className="space-y-4">
                    {popularFAQs.map((faq) => (
                      <FAQCard key={faq.id} faq={faq} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No popular FAQs available at the moment.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <h3 className="font-semibold">Still need help?</h3>
              <p className="text-sm text-muted-foreground">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/dashboard/chat" className="text-sm text-primary hover:underline">
                  Contact Support
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link to="/dashboard/chat" className="text-sm text-primary hover:underline">
                  Start Live Chat
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;
