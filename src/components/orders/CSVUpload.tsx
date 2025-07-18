
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { useBulkCreateOrders, validateCSVData, type CSVOrderData } from '@/hooks/useOrders';
import { toast } from 'sonner';

const CSVUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [validationResults, setValidationResults] = useState<{
    valid: CSVOrderData[];
    invalid: { row: number; errors: string[] }[];
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkCreateOrders = useBulkCreateOrders();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    parseCSV(file);
  };

  const parseCSV = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast.error('CSV file is empty');
        return;
      }

      if (lines.length > 51) { // 50 data rows + 1 header row
        toast.error('CSV file cannot contain more than 50 order rows');
        return;
      }

      // Parse CSV manually (simple implementation)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        
        return row;
      });

      setCsvData(data);
      
      // Validate the data
      const results = validateCSVData(data);
      setValidationResults(results);
      
      toast.success(`CSV parsed successfully. ${data.length} rows found.`);
    } catch (error) {
      console.error('CSV parsing error:', error);
      toast.error('Failed to parse CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!validationResults || validationResults.valid.length === 0) {
      toast.error('No valid orders to upload');
      return;
    }

    try {
      await bulkCreateOrders.mutateAsync(validationResults.valid);
      
      // Reset state after successful upload
      setSelectedFile(null);
      setCsvData([]);
      setValidationResults(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'orderNumber,customerName,customerMobile,scooterModel,status,orderDate,deliveryDate,deliveryAddress,amount',
      'ORD001,John Doe,+919876543210,450X,confirmed,2024-01-15,2024-01-25,"123 Main St, Bangalore",150000',
      'ORD002,Jane Smith,+919876543211,Rizta,processing,2024-01-16,2024-01-26,"456 Park Ave, Mumbai",120000'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'order_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setCsvData([]);
    setValidationResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV Order Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Upload order data via CSV file. Maximum 50 orders per upload. 
              Orders are automatically retained for 1 week before cleanup.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button onClick={downloadSampleCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Sample CSV
            </Button>
          </div>

          <div className="space-y-4">
            {!selectedFile ? (
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select CSV File</h3>
                <p className="text-muted-foreground mb-4">
                  Click to browse or drag and drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground">
                  Required columns: orderNumber, customerName, customerMobile, scooterModel, status, orderDate
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button onClick={resetUpload} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Processing CSV file...</p>
                    <Progress value={50} className="w-full" />
                  </div>
                )}

                {validationResults && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-semibold text-green-900">Valid Orders</p>
                              <p className="text-2xl font-bold text-green-600">
                                {validationResults.valid.length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-semibold text-red-900">Invalid Orders</p>
                              <p className="text-2xl font-bold text-red-600">
                                {validationResults.invalid.length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {validationResults.invalid.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-red-700">Validation Errors</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {validationResults.invalid.map((item, index) => (
                              <div key={index} className="border-l-4 border-red-400 pl-4">
                                <p className="font-medium">Row {item.row}:</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {item.errors.map((error, errorIndex) => (
                                    <li key={errorIndex}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpload}
                        disabled={
                          validationResults.valid.length === 0 || 
                          bulkCreateOrders.isPending
                        }
                        className="flex-1"
                      >
                        {bulkCreateOrders.isPending 
                          ? 'Uploading...' 
                          : `Upload ${validationResults.valid.length} Valid Orders`}
                      </Button>
                      <Button onClick={resetUpload} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVUpload;
