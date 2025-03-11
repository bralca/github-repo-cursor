import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    
    // Test connection by fetching a small amount of data
    const { data: repositories, error: repoError } = await supabase
      .from('repositories')
      .select('id, name, description, stars, forks')
      .limit(3);
    
    if (repoError) {
      console.error('Error fetching repositories:', repoError);
      return NextResponse.json(
        { error: 'Failed to fetch repositories', details: repoError.message },
        { status: 500 }
      );
    }
    
    const { data: contributors, error: contribError } = await supabase
      .from('contributors')
      .select('id, username, name')
      .limit(3);
    
    if (contribError) {
      console.error('Error fetching contributors:', contribError);
      return NextResponse.json(
        { error: 'Failed to fetch contributors', details: contribError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: {
        repositories,
        contributors,
      },
    });
  } catch (error) {
    console.error('Unexpected error in hooks-test API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: (error as Error).message },
      { status: 500 }
    );
  }
} 