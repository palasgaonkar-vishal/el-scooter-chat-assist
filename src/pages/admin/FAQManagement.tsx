
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ThumbsUp, 
  ThumbsDown,
  Settings,
  BarChart3,
  Filter
} from 'lucide-react';
import { useFAQManagement, FAQ_CATEGORIES } from '@/hooks/useFAQManagement';
import FAQForm from '@/components/admin/FAQForm';
import FAQAnalytics from '@/components/admin/FAQAnalytics';
import type { Database } from '@/integrations/supabase/types';

type FAQ = Database['public']['Tables']['faqs']['Row'];

const FAQManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFAQs, setSelectedFAQs] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempThreshold, setTempThreshold] = useState([70]);

  const {
    useAllFAQs,
    useCreateFAQ,
    useUpdateFAQ,
    useDeleteFAQ,
    useBulkUpdateFAQs,
    useConfidenceThreshold,
    useUpdateConfidenceThreshold
  } = useFAQManagement();

  const { data: faqs = [], isLoading } = useAllFAQs();
  const { data: currentThreshold = 0.15 } = useConfidenceThreshold();
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();
  const bulkUpdateFAQs = useBulkUpdateFAQs();
  const updateThreshold = useUpdateConfidenceThreshold();

  // Filter FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (faq.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateFAQ = (data: any) => {
    createFAQ.mutate(data, {
      onSuccess: () => {
        setIsFormOpen(false);
      }
    });
  };

  const handleUpdateFAQ = (data: any) => {
    if (editingFAQ) {
      updateFAQ.mutate({ id: editingFAQ.id, updates: data }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingFAQ(null);
        }
      });
    }
  };

  const handleDeleteFAQ = (id: string) => {
    deleteFAQ.mutate(id);
  };

  const handleBulkToggleActive = (active: boolean) => {
    if (selectedFAQs.length > 0) {
      bulkUpdateFAQs.mutate({
        ids: selectedFAQs,
        data: { is_active: active }
      }, {
        onSuccess: () => {
          setSelectedFAQs([]);
        }
      });
    }
  };

  const handleBulkDelete = () => {
    selectedFAQs.forEach(id => deleteFAQ.mutate(id));
    setSelectedFAQs([]);
  };

  const handleThresholdUpdate = () => {
    updateThreshold.mutate(tempThreshold[0] / 100, {
      onSuccess: () => {
        setIsSettingsOpen(false);
      }
    });
  };

  const handleSelectFAQ = (faqId: string, checked: boolean) => {
    if (checked) {
      setSelectedFAQs([...selectedFAQs, faqId]);
    } else {
      setSelectedFAQs(selectedFAQs.filter(id => id !== faqId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFAQs(filteredFAQs.map(faq => faq.id));
    } else {
      setSelectedFAQs([]);
    }
  };

  React.useEffect(() => {
    setTempThreshold([Math.round(currentThreshold * 100)]);
  }, [currentThreshold]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FAQ Management</h1>
          <p className="text-muted-foreground">
            Manage FAQs, categories, and system settings
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>FAQ System Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Confidence Threshold: {tempThreshold[0]}%</Label>
                  <Slider
                    value={tempThreshold}
                    onValueChange={setTempThreshold}
                    max={100}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum similarity score required for FAQ matching. Lower values show more results but may be less accurate.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleThresholdUpdate} disabled={updateThreshold.isPending}>
                    {updateThreshold.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList>
          <TabsTrigger value="manage">Manage FAQs</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search FAQs by question, answer, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {FAQ_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedFAQs.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedFAQs.length} FAQ{selectedFAQs.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkToggleActive(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBulkToggleActive(false)}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected FAQs</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedFAQs.length} FAQ{selectedFAQs.length > 1 ? 's' : ''}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleBulkDelete}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* FAQ List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>FAQs ({filteredFAQs.length})</CardTitle>
                  <CardDescription>
                    Manage your FAQ content and settings
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedFAQs.length === filteredFAQs.length && filteredFAQs.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm">Select All</Label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredFAQs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No FAQs found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedFAQs.includes(faq.id)}
                          onCheckedChange={(checked) => handleSelectFAQ(faq.id, checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <h4 className="font-medium text-sm line-clamp-2 flex-1">{faq.question}</h4>
                            <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                              <Badge variant={faq.is_active ? "default" : "secondary"}>
                                {faq.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">
                                {FAQ_CATEGORIES.find(cat => cat.value === faq.category)?.label || faq.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
                            {faq.answer}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingFAQ(faq);
                                  setIsFormOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this FAQ? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteFAQ(faq.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          {faq.tags && faq.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {faq.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <FAQAnalytics />
        </TabsContent>
      </Tabs>

      {/* FAQ Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) {
          setEditingFAQ(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}
            </DialogTitle>
          </DialogHeader>
          <FAQForm
            faq={editingFAQ}
            onSubmit={editingFAQ ? handleUpdateFAQ : handleCreateFAQ}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingFAQ(null);
            }}
            isLoading={createFAQ.isPending || updateFAQ.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FAQManagement;
