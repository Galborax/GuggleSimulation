import { NextRequest, NextResponse } from 'next/server';
import { getAllMarketData, getMarketDataByType, getHistoricalData, getMarketSummary } from '@/lib/market-data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const symbol = searchParams.get('symbol');
  const historical = searchParams.get('historical');

  if (historical && symbol) {
    return NextResponse.json({ data: getHistoricalData(symbol) });
  }
  if (type === 'summary') {
    return NextResponse.json({ data: getMarketSummary() });
  }
  if (type) {
    return NextResponse.json({ data: getMarketDataByType(type as 'stock' | 'index' | 'commodity') });
  }
  return NextResponse.json({ data: getAllMarketData() });
}
