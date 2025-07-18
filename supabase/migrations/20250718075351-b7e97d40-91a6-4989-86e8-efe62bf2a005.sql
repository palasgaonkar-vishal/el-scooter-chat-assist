
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE escalation_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE escalation_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE scooter_model AS ENUM ('450S', '450X', 'Rizta');
CREATE TYPE faq_category AS ENUM ('charging', 'service', 'range', 'orders', 'cost', 'license', 'warranty');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mobile_number TEXT UNIQUE,
    mobile_number_encrypted TEXT,
    name TEXT,
    email TEXT,
    address TEXT,
    scooter_models scooter_model[] DEFAULT '{}',
    role user_role DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create FAQs table
CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category faq_category NOT NULL,
    scooter_models scooter_model[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat conversations table
CREATE TABLE public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    query TEXT NOT NULL,
    response TEXT,
    faq_matched_id UUID REFERENCES public.faqs(id),
    confidence_score FLOAT,
    is_helpful BOOLEAN,
    file_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL,
    scooter_model scooter_model NOT NULL,
    status order_status DEFAULT 'pending',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_date TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(10,2),
    customer_mobile TEXT,
    customer_name TEXT,
    delivery_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create escalated queries table
CREATE TABLE public.escalated_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.chat_conversations(id),
    query TEXT NOT NULL,
    priority escalation_priority DEFAULT 'medium',
    status escalation_status DEFAULT 'pending',
    assigned_admin_id UUID REFERENCES public.profiles(id),
    admin_notes TEXT,
    resolution TEXT,
    escalated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table for tracking
CREATE TABLE public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES public.profiles(id),
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE DEFAULT CURRENT_DATE
);

-- Create system settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('faq_confidence_threshold', '0.7', 'Minimum confidence score for FAQ matching'),
('chat_retention_hours', '1', 'Hours to retain chat conversations'),
('session_timeout_minutes', '30', 'Session timeout in minutes'),
('max_file_size_mb', '10', 'Maximum file upload size in MB');

-- Create indexes for performance
CREATE INDEX idx_profiles_mobile ON public.profiles(mobile_number);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_faqs_category ON public.faqs(category);
CREATE INDEX idx_faqs_active ON public.faqs(is_active);
CREATE INDEX idx_faqs_question_gin ON public.faqs USING gin(to_tsvector('english', question));
CREATE INDEX idx_faqs_answer_gin ON public.faqs USING gin(to_tsvector('english', answer));
CREATE INDEX idx_chat_user_session ON public.chat_conversations(user_id, session_id);
CREATE INDEX idx_chat_expires ON public.chat_conversations(expires_at);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_escalated_status ON public.escalated_queries(status);
CREATE INDEX idx_escalated_priority ON public.escalated_queries(priority);
CREATE INDEX idx_analytics_date ON public.analytics(date);
CREATE INDEX idx_analytics_event ON public.analytics(event_type);

-- Create function for text similarity (cosine similarity with TF-IDF)
CREATE OR REPLACE FUNCTION public.calculate_text_similarity(query_text TEXT, faq_question TEXT, faq_answer TEXT)
RETURNS FLOAT AS $$
DECLARE
    similarity_score FLOAT;
BEGIN
    -- Calculate similarity using pg_trgm and text search
    WITH query_vector AS (
        SELECT to_tsvector('english', query_text) as query_ts
    ),
    faq_vector AS (
        SELECT 
            to_tsvector('english', faq_question || ' ' || faq_answer) as faq_ts
    )
    SELECT 
        GREATEST(
            similarity(query_text, faq_question),
            similarity(query_text, faq_answer),
            ts_rank(faq_vector.faq_ts, plainto_tsquery('english', query_text))
        )
    INTO similarity_score
    FROM query_vector, faq_vector;
    
    RETURN COALESCE(similarity_score, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
        CASE 
            WHEN NEW.email LIKE '%@atherenergy.com' THEN 'admin'::user_role
            ELSE 'customer'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to cleanup expired chat conversations
CREATE OR REPLACE FUNCTION public.cleanup_expired_chats()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.chat_conversations 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup event
    INSERT INTO public.analytics (event_type, event_data)
    VALUES ('chat_cleanup', jsonb_build_object('deleted_count', deleted_count));
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escalated_queries_updated_at BEFORE UPDATE ON public.escalated_queries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalated_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for FAQs
CREATE POLICY "Anyone can view active FAQs" ON public.faqs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQs" ON public.faqs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for chat conversations
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON public.chat_conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for escalated queries
CREATE POLICY "Users can view own escalated queries" ON public.escalated_queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own escalated queries" ON public.escalated_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage escalated queries" ON public.escalated_queries
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for analytics
CREATE POLICY "Admins can view analytics" ON public.analytics
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert analytics" ON public.analytics
    FOR INSERT WITH CHECK (true);

-- Create RLS policies for system settings
CREATE POLICY "Admins can manage system settings" ON public.system_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert sample FAQ data
INSERT INTO public.faqs (question, answer, category, scooter_models, tags) VALUES
-- Charging FAQs
('How long does it take to charge my Ather scooter?', 'The Ather 450S takes about 4.5 hours for a full charge using a home charger, while the 450X takes about 4 hours. Fast charging at Ather Grid points can charge up to 80% in about 1 hour.', 'charging', '{450S,450X}', '{charging,time,battery}'),
('Where can I find Ather charging stations?', 'You can find Ather Grid charging stations using the Ather app. We have over 1400+ charging points across major cities in India. The app shows real-time availability and navigation to the nearest charging point.', 'charging', '{450S,450X,Rizta}', '{charging,grid,locations}'),
('Can I charge my Ather scooter at home?', 'Yes, all Ather scooters come with a portable home charger that can be plugged into any standard 5A socket. The charging cable is removable and can be taken anywhere.', 'charging', '{450S,450X,Rizta}', '{home,charging,portable}'),

-- Service FAQs
('How often should I service my Ather scooter?', 'We recommend servicing your Ather scooter every 2500 km or 2 months, whichever comes first. The service includes battery health check, software updates, and general maintenance.', 'service', '{450S,450X,Rizta}', '{maintenance,service,schedule}'),
('What is covered under Ather warranty?', 'Ather scooters come with a 3-year warranty on the vehicle and an 8-year warranty on the battery. This covers manufacturing defects and battery degradation below 70% of original capacity.', 'warranty', '{450S,450X,Rizta}', '{warranty,coverage,battery}'),

-- Range FAQs
('What is the range of Ather 450X?', 'The Ather 450X offers a certified range of 105 km in Eco mode and 85 km in Sport mode on a single charge under standard test conditions.', 'range', '{450X}', '{range,450X,distance}'),
('What is the range of Ather 450S?', 'The Ather 450S provides a certified range of 90 km in Eco mode and 70 km in Sport mode on a single charge under standard test conditions.', 'range', '{450S}', '{range,450S,distance}'),
('What is the range of Ather Rizta?', 'The Ather Rizta offers an impressive range of up to 160 km in Eco mode, making it perfect for daily commuting and longer rides.', 'range', '{Rizta}', '{range,Rizta,distance}'),

-- Orders FAQs
('How can I track my Ather scooter order?', 'You can track your order status through your Ather account dashboard or by calling our customer support. We provide regular updates via SMS and email throughout the delivery process.', 'orders', '{450S,450X,Rizta}', '{tracking,order,delivery}'),
('What is the delivery time for Ather scooters?', 'Delivery typically takes 2-4 weeks from the date of order confirmation, depending on your location and model availability. We will keep you updated throughout the process.', 'orders', '{450S,450X,Rizta}', '{delivery,time,order}'),

-- Cost FAQs
('What is the price of Ather 450X?', 'The Ather 450X is priced starting from ₹1,46,926 (ex-showroom Delhi) after government subsidies. Prices may vary by state due to different subsidy amounts.', 'cost', '{450X}', '{price,450X,cost}'),
('What is the price of Ather 450S?', 'The Ather 450S is priced starting from ₹1,29,873 (ex-showroom Delhi) after government subsidies. Prices may vary by state due to different subsidy amounts.', 'cost', '{450S}', '{price,450S,cost}'),
('What is the price of Ather Rizta?', 'The Ather Rizta is priced starting from ₹1,09,999 (ex-showroom Delhi) after government subsidies. Check our website for the latest pricing in your city.', 'cost', '{Rizta}', '{price,Rizta,cost}'),

-- License FAQs
('What type of license do I need for Ather scooters?', 'You need a valid two-wheeler driving license to ride any Ather scooter. The same license that is valid for petrol scooters/motorcycles is applicable for electric vehicles.', 'license', '{450S,450X,Rizta}', '{license,driving,requirements}'),
('Do I need any special permit for electric scooters?', 'No special permit is required for electric scooters. Standard RTO registration and a valid driving license are sufficient to ride Ather scooters legally.', 'license', '{450S,450X,Rizta}', '{permit,registration,legal}');

-- Update FAQ view counts and ratings (simulate some usage)
UPDATE public.faqs SET view_count = 150, helpful_count = 120, not_helpful_count = 10 WHERE question LIKE '%charge%';
UPDATE public.faqs SET view_count = 200, helpful_count = 180, not_helpful_count = 15 WHERE question LIKE '%range%';
UPDATE public.faqs SET view_count = 100, helpful_count = 85, not_helpful_count = 8 WHERE question LIKE '%service%';
