
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Upload, TrendingUp, Users } from "lucide-react";
import { useAllOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import CSVUpload from "@/components/orders/CSVUpload";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database['public']['Enums']['order_status'];
type Order = Database['public']['Tables']['orders']['Row'];

const OrderManagement = () => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  
  const { data: allOrders, isLoading } = useAllOrders(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const updateOrderStatus = useUpdateOrderStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStats = () => {
    if (!allOrders) return { total: 0, pending: 0, processing: 0, delivered: 0 };
    
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => ['pending', 'confirmed'].includes(o.status || 'pending')).length,
      processing: allOrders.filter(o => ['processing', 'shipped'].includes(o.status || 'pending')).length,
      delivered: allOrders.filter(o => o.status === 'delivered').length,
    };
  };

  const stats = getOrderStats();

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus.mutateAsync({
      orderId,
      status: newStatus,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">
          Manage orders, track status, and upload order data via CSV
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order List
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                CSV Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">All Orders</h2>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={(value) => setSelectedStatus(value as OrderStatus | 'all')}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Orders</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <OrderList orders={allOrders || []} onStatusUpdate={handleStatusUpdate} />
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-6">
              <CSVUpload />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

interface OrderListProps {
  orders: Order[];
  onStatusUpdate: (orderId: string, status: OrderStatus) => Promise<void>;
}

const OrderList = ({ orders, onStatusUpdate }: OrderListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground">
            No orders match the current filter criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">#{order.order_number}</h3>
                  <Badge className={getStatusColor(order.status || 'pending')}>
                    {(order.status || 'pending').toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_mobile}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Model</p>
                    <p className="font-medium">Ather {order.scooter_model}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Order Date</p>
                    <p className="font-medium">{formatDate(order.order_date)}</p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Delivery Date</p>
                    <p className="font-medium">{formatDate(order.delivery_date)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select 
                  value={order.status || 'pending'} 
                  onValueChange={(value) => onStatusUpdate(order.id, value as OrderStatus)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderManagement;
