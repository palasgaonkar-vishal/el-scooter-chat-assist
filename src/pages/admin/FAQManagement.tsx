
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Search } from "lucide-react";

const FAQManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [newFAQ, setNewFAQ] = useState({
    question: "",
    answer: "",
    category: "",
  });

  // Sample FAQ data
  const faqs = [
    {
      id: 1,
      question: "How do I charge my Ather scooter?",
      answer: "You can charge your Ather scooter using the portable charger provided or at any Ather Grid charging station.",
      category: "Charging",
      hitCount: 45,
    },
    {
      id: 2,
      question: "What is the range of Ather 450X?",
      answer: "The Ather 450X has a range of up to 146 km in Eco mode and 105 km in Sport mode.",
      category: "Specifications",
      hitCount: 32,
    },
  ];

  const handleAddFAQ = () => {
    // TODO: Implement FAQ creation in Task 009
    console.log("Adding FAQ:", newFAQ);
    setNewFAQ({ question: "", answer: "", category: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground">
            Manage frequently asked questions and their answers
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New FAQ</DialogTitle>
              <DialogDescription>
                Create a new frequently asked question and answer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Charging, Maintenance, etc."
                  value={newFAQ.category}
                  onChange={(e) => setNewFAQ(prev => ({...prev, category: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  placeholder="Enter the question..."
                  value={newFAQ.question}
                  onChange={(e) => setNewFAQ(prev => ({...prev, question: e.target.value}))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  placeholder="Enter the answer..."
                  className="min-h-[100px]"
                  value={newFAQ.answer}
                  onChange={(e) => setNewFAQ(prev => ({...prev, answer: e.target.value}))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddFAQ}>Add FAQ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search FAQs</CardTitle>
          <CardDescription>
            Find and manage existing frequently asked questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{faq.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {faq.hitCount} views
                    </span>
                  </div>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FAQManagement;
