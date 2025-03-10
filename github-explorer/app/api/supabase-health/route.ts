import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Create an admin client to test connection
    const supabase = createServiceSupabaseClient()
    
    // Simple health check query
    const { data, error } = await supabase.from('repositories').select('count').single()
    
    if (error) {
      console.error('Supabase health check error:', error)
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Could not connect to Supabase', 
          error: error.message 
        }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      status: 'healthy', 
      message: 'Supabase connection successful',
      data
    })
  } catch (error) {
    console.error('Supabase health check error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to check Supabase health',
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
} 