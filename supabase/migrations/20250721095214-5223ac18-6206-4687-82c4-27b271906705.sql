-- Insert sample FAQs to populate the database for testing
INSERT INTO public.faqs (question, answer, category, scooter_models, tags) VALUES 
  (
    'How do I charge my Ather scooter?',
    'To charge your Ather scooter: 1) Connect the charger to your scooter''s charging port. 2) Plug the charger into a standard electrical outlet. 3) The charging indicator will show the progress. 4) A full charge typically takes 5-8 hours depending on your model.',
    'charging',
    ARRAY['450S', '450X', 'Rizta']::scooter_model[],
    ARRAY['charging', 'battery', 'power']::text[]
  ),
  (
    'What is the range of Ather 450X?',
    'The Ather 450X offers a range of up to 146km on a single charge in Eco mode. In Sport mode, the range is approximately 116km. Actual range may vary based on riding conditions, weather, and usage patterns.',
    'range',
    ARRAY['450X']::scooter_model[],
    ARRAY['range', 'battery', 'performance']::text[]
  ),
  (
    'How do I book a service appointment?',
    'You can book a service appointment through: 1) The Ather mobile app - go to Service section. 2) Call our customer care. 3) Visit any Ather service center. 4) Use our website''s service booking feature. We recommend scheduling service every 6 months or 5000km.',
    'service',
    ARRAY['450S', '450X', 'Rizta']::scooter_model[],
    ARRAY['service', 'maintenance', 'appointment']::text[]
  ),
  (
    'What is the warranty on Ather scooters?',
    'Ather provides a comprehensive warranty: 1) Vehicle warranty: 3 years or 30,000km. 2) Battery warranty: 3 years or 30,000km with 70% capacity retention. 3) Motor warranty: 3 years or 30,000km. Extended warranty options are also available.',
    'warranty',
    ARRAY['450S', '450X', 'Rizta']::scooter_model[],
    ARRAY['warranty', 'coverage', 'protection']::text[]
  ),
  (
    'How much does an Ather scooter cost?',
    'Ather scooter pricing varies by model and location: 1) Ather 450S: Starting from ₹1.29 lakhs (ex-showroom). 2) Ather 450X: Starting from ₹1.39 lakhs (ex-showroom). 3) Ather Rizta: Starting from ₹1.09 lakhs (ex-showroom). Prices may vary by state due to subsidies and taxes.',
    'cost',
    ARRAY['450S', '450X', 'Rizta']::scooter_model[],
    ARRAY['price', 'cost', 'purchase']::text[]
  )
ON CONFLICT DO NOTHING;