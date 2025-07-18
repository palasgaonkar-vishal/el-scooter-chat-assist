
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, ThumbsDown, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useRateFAQ, useIncrementFAQView } from '@/hooks/useFAQ';
import type { Database } from '@/integrations/supabase/types';

type FAQ = Database['public']['Tables']['faqs']['Row'];

interface FAQWithSimilarity extends FAQ {
  similarity_score?: number;
}

interface FAQCardProps {
  faq: FAQWithSimilarity;
  showSimilarityScore?: boolean;
  className?: string;
}

export const FAQCard: React.FC<FAQCardProps> = ({ 
  faq, 
  showSimilarityScore = false,
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const rateFAQMutation = useRateFAQ();
  const incrementViewMutation = useIncrementFAQView();

  const handleExpand = () => {
    if (!isExpanded) {
      // Increment view count when expanding for the first time
      incrementViewMutation.mutate(faq.id);
    }
    setIsExpanded(!isExpanded);
  };

  const handleRating = (isHelpful: boolean) => {
    if (hasRated) return;

    rateFAQMutation.mutate({ faqId: faq.id, isHelpful });
    setHasRated(true);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      charging: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      service: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      range: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      orders: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      cost: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      license: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      warranty: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight mb-2">
              {faq.question}
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={getCategoryColor(faq.category)}>
                {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
              </Badge>
              
              {faq.scooter_models && faq.scooter_models.length > 0 && (
                <div className="flex gap-1">
                  {faq.scooter_models.map((model) => (
                    <Badge key={model} variant="outline" className="text-xs">
                      {model}
                    </Badge>
                  ))}
                </div>
              )}
              
              {showSimilarityScore && faq.similarity_score && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {Math.round(faq.similarity_score * 100)}% match
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {faq.answer}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {faq.view_count !== null && (
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{faq.view_count}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4 text-green-600" />
                  <span>{faq.helpful_count || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsDown className="h-4 w-4 text-red-600" />
                  <span>{faq.not_helpful_count || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Was this helpful?</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRating(true)}
                disabled={hasRated || rateFAQMutation.isPending}
                className="h-8 px-3"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRating(false)}
                disabled={hasRated || rateFAQMutation.isPending}
                className="h-8 px-3"
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                No
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
