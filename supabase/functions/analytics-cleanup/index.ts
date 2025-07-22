import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting analytics data retention cleanup...');

    // Analytics data retention: 1 week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Clean up old analytics events
    const { data: deletedAnalytics, error: analyticsError } = await supabase
      .from('analytics')
      .delete()
      .lt('created_at', oneWeekAgo.toISOString());

    if (analyticsError) {
      console.error('Error cleaning up analytics:', analyticsError);
      throw analyticsError;
    }

    // Clean up expired chat conversations (1 hour retention)
    const { data: deletedChats, error: chatsError } = await supabase
      .from('chat_conversations')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (chatsError) {
      console.error('Error cleaning up expired chats:', chatsError);
      throw chatsError;
    }

    // Clean up expired OTP verifications (5 minutes retention)
    const { data: deletedOTPs, error: otpError } = await supabase
      .from('otp_verifications')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (otpError) {
      console.error('Error cleaning up expired OTPs:', otpError);
      throw otpError;
    }

    // Clean up expired chat sessions
    const { data: deletedSessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (sessionsError) {
      console.error('Error cleaning up expired sessions:', sessionsError);
      throw sessionsError;
    }

    const summary = {
      timestamp: new Date().toISOString(),
      deletedAnalytics: deletedAnalytics?.length || 0,
      deletedChats: deletedChats?.length || 0,
      deletedOTPs: deletedOTPs?.length || 0,
      deactivatedSessions: deletedSessions?.length || 0,
    };

    console.log('Cleanup completed:', summary);

    // Log the cleanup operation to analytics
    const { error: logError } = await supabase
      .from('analytics')
      .insert({
        event_type: 'data_retention_cleanup',
        event_data: summary,
      });

    if (logError) {
      console.error('Error logging cleanup operation:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data retention cleanup completed',
        summary 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Data retention cleanup failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});