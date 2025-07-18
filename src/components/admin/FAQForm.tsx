
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { FAQ_CATEGORIES, SCOOTER_MODELS } from '@/hooks/useFAQManagement';
import type { Database } from '@/integrations/supabase/types';

type FAQ = Database['public']['Tables']['faqs']['Row'];
type FAQCategory = Database['public']['Enums']['faq_category'];
type ScooterModel = Database['public']['Enums']['scooter_model'];

const faqSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
  answer: z.string().min(20, 'Answer must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  scooter_models: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().default(true)
});

type FAQFormData = z.infer<typeof faqSchema>;

interface FAQFormProps {
  faq?: FAQ | null;
  onSubmit: (data: FAQFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const FAQForm: React.FC<FAQFormProps> = ({ faq, onSubmit, onCancel, isLoading }) => {
  const [newTag, setNewTag] = React.useState('');
  
  const form = useForm<FAQFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: faq?.question || '',
      answer: faq?.answer || '',
      category: faq?.category || '',
      scooter_models: faq?.scooter_models || [],
      tags: faq?.tags || [],
      is_active: faq?.is_active ?? true
    }
  });

  const watchedTags = form.watch('tags') || [];

  const handleAddTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      form.setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const handleScooterModelChange = (modelValue: string, checked: boolean) => {
    const currentModels = form.getValues('scooter_models') || [];
    if (checked) {
      form.setValue('scooter_models', [...currentModels, modelValue as ScooterModel]);
    } else {
      form.setValue('scooter_models', currentModels.filter(model => model !== modelValue));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {faq ? 'Edit FAQ' : 'Create New FAQ'}
        </h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Input placeholder="Enter the FAQ question" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Answer</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the detailed answer"
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FAQ_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scooter_models"
            render={() => (
              <FormItem>
                <FormLabel>Applicable Scooter Models</FormLabel>
                <div className="grid grid-cols-3 gap-4">
                  {SCOOTER_MODELS.map((model) => (
                    <FormField
                      key={model.value}
                      control={form.control}
                      name="scooter_models"
                      render={() => {
                        const currentModels = form.getValues('scooter_models') || [];
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={currentModels.includes(model.value)}
                                onCheckedChange={(checked) => 
                                  handleScooterModelChange(model.value, checked as boolean)
                                }
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {model.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={() => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline">
                      Add Tag
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Active FAQ
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Active FAQs are visible to customers and available for matching
                  </p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : (faq ? 'Update FAQ' : 'Create FAQ')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default FAQForm;
