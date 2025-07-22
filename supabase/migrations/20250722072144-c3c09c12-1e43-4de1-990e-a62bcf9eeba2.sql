-- Test by inserting an order with 917777777777 format (without +91 prefix) 
INSERT INTO public.orders (order_number, customer_name, customer_mobile, scooter_model, status, order_date, amount)
VALUES ('ORD003', 'Test Customer', '917777777777', '450S', 'pending', '2024-01-20', 130000);