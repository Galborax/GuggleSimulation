import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews, getNewsByCategory } from '@/lib/news-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');

  if (category) {
    return NextResponse.json({ data: getNewsByCategory(category) });
  }
  return NextResponse.json({ data: getLatestNews() });
}
