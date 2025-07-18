
import OrderStatusLookup from "@/components/orders/OrderStatusLookup";

const OrderStatus = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Order Status</h1>
        <p className="text-muted-foreground">
          Track your Ather scooter order status and delivery information
        </p>
      </div>
      
      <OrderStatusLookup />
    </div>
  );
};

export default OrderStatus;
