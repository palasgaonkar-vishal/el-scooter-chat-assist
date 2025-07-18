
import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');
    
    // Create admin user
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@atherenergy.com',
      password: 'admin123',
      options: {
        data: {
          name: 'Admin User'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('Admin user already exists');
        return { success: true, message: 'Admin user already exists' };
      }
      throw error;
    }

    console.log('Admin user created successfully:', data);
    return { success: true, message: 'Admin user created successfully' };
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, error };
  }
};
