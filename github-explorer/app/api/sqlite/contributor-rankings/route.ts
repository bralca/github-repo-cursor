import { NextRequest, NextResponse } from 'next/server';
import { handleContributorRankings } from '../handlers/contributor-rankings';

export async function POST(request: NextRequest) {
  return await handleContributorRankings(request);
}

export const dynamic = 'force-dynamic'; 