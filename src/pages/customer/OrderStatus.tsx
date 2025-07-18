
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, Truck, CheckCircle } from "lucide-react";

const OrderStatus = () => {
  const [orderId, setOrderId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement order lookup in Task 008
    console.log("Searching for order:", orderId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Status</h1>
        <p className="text-muted-foreground">
          Track your Ather scooter order and delivery status
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Track Your Order</CardTitle>
          <CardDescription>
            Enter your order ID or phone number to check status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="orderId" className="sr-only">
                Order ID
              </Label>
              <Input
                id="orderId"
                placeholder="Enter Order ID or Phone Number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sample Order Status Display */}
      <Card>
        <CardHeader>
          <CardTitle>Order #ATH-2024-001</CardTitle>
          <CardDescription>Ather 450X Gen 3 - Space Grey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Confirmed</p>
                <p className="text-sm text-muted-foreground">March 15, 2024</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Manufacturing</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="font-medium">Ready for Dispatch</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <Truck className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="flex items-center justify-between opacity-50">
              <div>
                <p className="font-medium">Delivered</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Estimated Delivery:</strong> April 10-15, 2024
            </p>
            <p className="text-sm mt-1">
              <strong>Delivery Address:</strong> Bangalore, Karnataka
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderStatus;
