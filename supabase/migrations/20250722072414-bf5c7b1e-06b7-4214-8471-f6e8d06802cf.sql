-- Test by inserting an order with 916666666666 format (without +91 prefix) 
INSERT INTO public.orders (order_number, customer_name, customer_mobile, scooter_model, status, order_date, amount)
VALUES ('ORD004', 'Test Customer', '916666666666', '450S', 'pending', '2024-01-20', 130000);