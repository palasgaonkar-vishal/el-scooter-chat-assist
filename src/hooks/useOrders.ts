
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderStatus = Database['public']['Enums']['order_status'];
type ScooterModel = Database['public']['Enums']['scooter_model'];

export interface OrderStatusLookup {
  orderNumber?: string;
  mobileNumber?: string;
}

export interface CSVOrderData {
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  scooterModel: ScooterModel;
  status: OrderStatus;
  orderDate: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  amount?: number;
}

// Get orders by mobile number (for customer lookup)
export const useOrdersByMobile = (mobileNumber: string) => {
  return useQuery({
    queryKey: ['orders', 'mobile', mobileNumber],
    queryFn: async (): Promise<Order[]> => {
      if (!mobileNumber || mobileNumber.length < 10) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_mobile', mobileNumber)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders by mobile:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!mobileNumber && mobileNumber.length >= 10,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get order by order number
export const useOrderByNumber = (orderNumber: string) => {
  return useQuery({
    queryKey: ['orders', 'number', orderNumber],
    queryFn: async (): Promise<Order | null> => {
      if (!orderNumber) return null;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        console.error('Error fetching order by number:', error);
        throw error;
      }

      return data;
    },
    enabled: !!orderNumber,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Get all orders (admin only)
export const useAllOrders = (status?: OrderStatus) => {
  return useQuery({
    queryKey: ['orders', 'all', status],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all orders:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Create bulk orders from CSV
export const useBulkCreateOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orders: CSVOrderData[]): Promise<{ success: number; failed: number; errors: string[] }> => {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process orders in batches of 10 to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < orders.length; i += batchSize) {
        const batch = orders.slice(i, i + batchSize);
        
        const orderInserts: OrderInsert[] = batch.map(order => ({
          order_number: order.orderNumber,
          customer_name: order.customerName,
          customer_mobile: order.customerMobile,
          scooter_model: order.scooterModel,
          status: order.status,
          order_date: order.orderDate,
          delivery_date: order.deliveryDate || null,
          delivery_address: order.deliveryAddress || null,
          amount: order.amount || null,
        }));

        try {
          const { error } = await supabase
            .from('orders')
            .insert(orderInserts);

          if (error) {
            console.error('Batch insert error:', error);
            results.failed += batch.length;
            results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          } else {
            results.success += batch.length;
          }
        } catch (error) {
          console.error('Batch processing error:', error);
          results.failed += batch.length;
          results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      
      if (results.success > 0) {
        toast.success(`Successfully imported ${results.success} orders`);
      }
      
      if (results.failed > 0) {
        toast.error(`Failed to import ${results.failed} orders`);
      }
    },
    onError: (error) => {
      console.error('Bulk order creation error:', error);
      toast.error('Failed to process CSV upload');
    },
  });
};

// Update order status (admin only)
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, deliveryDate }: { 
      orderId: string; 
      status: OrderStatus;
      deliveryDate?: string;
    }) => {
      const updates: Partial<Order> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (deliveryDate) {
        updates.delivery_date = deliveryDate;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated successfully');
    },
    onError: (error) => {
      console.error('Order status update error:', error);
      toast.error('Failed to update order status');
    },
  });
};

// CSV validation helper
export const validateCSVData = (data: any[]): { valid: CSVOrderData[]; invalid: { row: number; errors: string[] }[] } => {
  const valid: CSVOrderData[] = [];
  const invalid: { row: number; errors: string[] }[] = [];

  const validScooterModels: ScooterModel[] = ['450S', '450X', 'Rizta'];
  const validOrderStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  data.forEach((row, index) => {
    const errors: string[] = [];
    
    // Required fields validation
    if (!row.orderNumber || typeof row.orderNumber !== 'string') {
      errors.push('Order number is required');
    }
    
    if (!row.customerName || typeof row.customerName !== 'string') {
      errors.push('Customer name is required');
    }
    
    if (!row.customerMobile || typeof row.customerMobile !== 'string') {
      errors.push('Customer mobile is required');
    } else if (!/^\+?[\d\s-()]{10,15}$/.test(row.customerMobile.toString())) {
      errors.push('Invalid mobile number format');
    }
    
    if (!row.scooterModel || !validScooterModels.includes(row.scooterModel)) {
      errors.push(`Invalid scooter model. Must be one of: ${validScooterModels.join(', ')}`);
    }
    
    if (!row.status || !validOrderStatuses.includes(row.status)) {
      errors.push(`Invalid status. Must be one of: ${validOrderStatuses.join(', ')}`);
    }
    
    if (!row.orderDate) {
      errors.push('Order date is required');
    } else {
      const date = new Date(row.orderDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid order date format');
      }
    }

    // Optional fields validation
    if (row.deliveryDate) {
      const deliveryDate = new Date(row.deliveryDate);
      if (isNaN(deliveryDate.getTime())) {
        errors.push('Invalid delivery date format');
      }
    }

    if (row.amount && (isNaN(parseFloat(row.amount)) || parseFloat(row.amount) < 0)) {
      errors.push('Amount must be a positive number');
    }

    if (errors.length > 0) {
      invalid.push({ row: index + 1, errors });
    } else {
      valid.push({
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        customerMobile: row.customerMobile,
        scooterModel: row.scooterModel,
        status: row.status,
        orderDate: row.orderDate,
        deliveryDate: row.deliveryDate || undefined,
        deliveryAddress: row.deliveryAddress || undefined,
        amount: row.amount ? parseFloat(row.amount) : undefined,
      });
    }
  });

  return { valid, invalid };
};
