
import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async (email: string, password: string, name: string = 'Admin User') => {
  try {
    console.log('Creating admin user...');
    
    // Create admin user using signUp directly with proper configuration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name
        }
      }
    });

    console.log(`Admin credentials: ${email} / ${password}`);

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        console.log('Admin user already exists');
        return { success: true, message: 'Admin user already exists' };
      }
      console.error('Admin user creation error:', error.message);
      throw error;
    }

    console.log('Admin user created successfully:', data);
    
    // Check if user was created but needs email confirmation
    if (data.user && !data.user.email_confirmed_at) {
      return { 
        success: true, 
        message: 'Admin user created. Email confirmation may be required in production.' 
      };
    }
    
    return { success: true, message: 'Admin user created successfully' };
    
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create admin user'
    };
  }
};
