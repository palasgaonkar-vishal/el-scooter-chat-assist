
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Battery, 
  Wrench, 
  Gauge, 
  ShoppingCart, 
  DollarSign, 
  FileCheck, 
  Shield,
  AlertCircle
} from 'lucide-react';
import { useFAQsByCategory } from '@/hooks/useFAQ';
import { FAQCard } from './FAQCard';
import type { Database } from '@/integrations/supabase/types';

type FAQCategory = Database['public']['Enums']['faq_category'];

interface CategoryInfo {
  id: FAQCategory;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'charging',
    name: 'Charging',
    description: 'Battery charging, charger types, and charging stations',
    icon: Battery,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  {
    id: 'service',
    name: 'Service',
    description: 'Maintenance, repairs, and service centers',
    icon: Wrench,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  {
    id: 'range',
    name: 'Range',
    description: 'Battery range, performance, and efficiency',
    icon: Gauge,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  {
    id: 'orders',
    name: 'Orders',
    description: 'Order status, delivery, and booking process',
    icon: ShoppingCart,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  {
    id: 'cost',
    name: 'Cost & Pricing',
    description: 'Pricing, EMI, insurance, and cost-related queries',
    icon: DollarSign,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  },
  {
    id: 'license',
    name: 'License',
    description: 'Driving license requirements and registration',
    icon: FileCheck,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  {
    id: 'warranty',
    name: 'Warranty',
    description: 'Warranty coverage, claims, and terms',
    icon: Shield,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
  }
];

interface FAQCategoryBrowserProps {
  selectedCategory?: FAQCategory;
  onCategorySelect?: (category: FAQCategory | undefined) => void;
  className?: string;
}

export const FAQCategoryBrowser: React.FC<FAQCategoryBrowserProps> = ({
  selectedCategory,
  onCategorySelect,
  className = ""
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CATEGORIES.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            onClick={() => {
              const newSelection = selectedCategory === category.id ? undefined : category.id;
              onCategorySelect?.(newSelection);
            }}
          />
        ))}
      </div>

      {/* Selected Category FAQs */}
      {selectedCategory && (
        <SelectedCategoryFAQs category={selectedCategory} />
      )}
    </div>
  );
};

interface CategoryCardProps {
  category: CategoryInfo;
  isSelected: boolean;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onClick }) => {
  const Icon = category.icon;
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${category.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1">{category.name}</h3>
            <p className="text-xs text-muted-foreground leading-tight">
              {category.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SelectedCategoryFAQsProps {
  category: FAQCategory;
}

const SelectedCategoryFAQs: React.FC<SelectedCategoryFAQsProps> = ({ category }) => {
  const { data: faqs, isLoading, error } = useFAQsByCategory(category);
  const categoryInfo = CATEGORIES.find(cat => cat.id === category);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
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
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load FAQs for this category. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!faqs || faqs.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No FAQs found in the {categoryInfo?.name} category.
        </AlertDescription>
      </Alert>
    );
  }

  const Icon = categoryInfo?.icon || AlertCircle;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${categoryInfo?.color || 'bg-gray-100'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">{categoryInfo?.name} FAQs</h2>
          <p className="text-sm text-muted-foreground">
            {faqs.length} question{faqs.length !== 1 ? 's' : ''} • {categoryInfo?.description}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <FAQCard key={faq.id} faq={faq} />
        ))}
      </div>
    </div>
  );
};
