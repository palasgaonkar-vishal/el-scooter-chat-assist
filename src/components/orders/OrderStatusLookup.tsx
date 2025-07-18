
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Package, Calendar, MapPin, CreditCard, Truck } from 'lucide-react';
import { useOrdersByMobile, useOrderByNumber } from '@/hooks/useOrders';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];

const OrderStatusLookup = () => {
  const [searchType, setSearchType] = useState<'mobile' | 'order'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [searchValue, setSearchValue] = useState('');

  const { data: ordersByMobile, isLoading: loadingByMobile } = useOrdersByMobile(
    searchType === 'mobile' ? searchValue : ''
  );
  
  const { data: orderByNumber, isLoading: loadingByNumber } = useOrderByNumber(
    searchType === 'order' ? searchValue : ''
  );

  const handleSearch = () => {
    if (searchType === 'mobile') {
      setSearchValue(mobileNumber);
    } else {
      setSearchValue(orderNumber);
    }
  };

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
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const orders = searchType === 'mobile' ? ordersByMobile : (orderByNumber ? [orderByNumber] : []);
  const isLoading = searchType === 'mobile' ? loadingByMobile : loadingByNumber;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Order Status Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              variant={searchType === 'mobile' ? 'default' : 'outline'}
              onClick={() => setSearchType('mobile')}
              className="flex-1"
            >
              Search by Mobile Number
            </Button>
            <Button
              variant={searchType === 'order' ? 'default' : 'outline'}
              onClick={() => setSearchType('order')}
              className="flex-1"
            >
              Search by Order Number
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={
                searchType === 'mobile' 
                  ? 'Enter mobile number (e.g., +91XXXXXXXXXX)' 
                  : 'Enter order number'
              }
              value={searchType === 'mobile' ? mobileNumber : orderNumber}
              onChange={(e) => {
                if (searchType === 'mobile') {
                  setMobileNumber(e.target.value);
                } else {
                  setOrderNumber(e.target.value);
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch}
              disabled={
                isLoading || 
                (searchType === 'mobile' ? !mobileNumber.trim() : !orderNumber.trim())
              }
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchValue && (
        <div className="space-y-4">
          {isLoading && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-muted-foreground mt-4">Searching for orders...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && orders && orders.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                <p className="text-muted-foreground">
                  {searchType === 'mobile' 
                    ? 'No orders found for this mobile number.' 
                    : 'No order found with this order number.'}
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && orders && orders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {orders.length > 1 ? `${orders.length} Orders Found` : 'Order Details'}
              </h2>
              
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OrderCard = ({ order }: { order: Order }) => {
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
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {order.customer_name} • {order.customer_mobile}
            </p>
          </div>
          <Badge className={getStatusColor(order.status || 'pending')}>
            {(order.status || 'pending').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Model</p>
              <p className="text-sm text-muted-foreground">Ather {order.scooter_model}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Order Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(order.order_date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Delivery Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(order.delivery_date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Amount</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(order.amount)}</p>
            </div>
          </div>
        </div>

        {order.delivery_address && (
          <>
            <Separator />
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Delivery Address</p>
                <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusLookup;
