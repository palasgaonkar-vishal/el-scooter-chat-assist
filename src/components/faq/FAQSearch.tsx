
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { useSearchFAQs } from '@/hooks/useFAQ';
import { useProfile } from '@/hooks/useProfile';
import { FAQCard } from './FAQCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FAQSearchProps {
  className?: string;
}

export const FAQSearch: React.FC<FAQSearchProps> = ({ className = "" }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: profile } = useProfile();
  const { data: searchResults, isLoading, error } = useSearchFAQs(
    debouncedQuery, 
    profile?.scooter_models || undefined
  );

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const hasResults = searchResults && searchResults.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search FAQs... (e.g., 'charging time', 'range per charge', 'warranty period')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {debouncedQuery && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Search Results for "{debouncedQuery}"
            </h3>
            {hasResults && (
              <span className="text-sm text-muted-foreground">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to search FAQs. Please try again later.
              </AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && !hasResults && (
            <Alert>
              <AlertDescription>
                No FAQs found matching your search. Try using different keywords or browse by category below.
              </AlertDescription>
            </Alert>
          )}

          {hasResults && (
            <div className="space-y-3">
              {searchResults.map((faq) => (
                <FAQCard
                  key={faq.id}
                  faq={faq}
                  showSimilarityScore={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!debouncedQuery && (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto space-y-3">
            <h3 className="text-lg font-medium text-muted-foreground">
              Search our FAQ Database
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter your question or keywords to find relevant answers. Our smart search will find the most helpful FAQs based on your query.
            </p>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'charging time',
                  'battery range',
                  'warranty',
                  'service cost',
                  'license required'
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(suggestion)}
                    className="h-7 px-2 text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
