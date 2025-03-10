import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient()
    
    // Test connection and credentials
    const { data, error } = await supabase
      .from('repositories')
      .select('count')
      .single()

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to connect to Supabase',
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Successfully connected to Supabase',
      data,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({ 
      status: 'error',
      message: 'Test endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 