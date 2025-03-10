import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
    };

    // If any environment variable is missing, return error
    if (!envCheck.hasUrl || !envCheck.hasKey || !envCheck.hasServiceKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Missing environment variables', 
        envCheck 
      }, { status: 500 });
    }

    // Test connection
    try {
      const supabase = createServiceSupabaseClient();
      
      // Simple health check query
      const { data, error } = await supabase.from('repositories').select('count').single();
      
      if (error) {
        console.error('Supabase health check error:', error);
        return NextResponse.json(
          { 
            status: 'error', 
            message: 'Could not connect to Supabase', 
            error: error.message,
            envCheck
          }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        status: 'success', 
        message: 'Supabase connection successful',
        data,
        envCheck
      });
    } catch (connectionError) {
      console.error('Supabase connection creation error:', connectionError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to create Supabase client',
        error: connectionError instanceof Error ? connectionError.message : String(connectionError),
        envCheck
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Test endpoint error',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 