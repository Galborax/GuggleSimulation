import { StockData, HistoricalDataPoint, MarketSummary } from '@/types/market';

export const mockMarketData: StockData[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.50, change: 2.30, changePercent: 1.23, volume: 58234000, marketCap: 2940000000000, sector: 'Technology', type: 'stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.20, change: -1.80, changePercent: -0.43, volume: 21456000, marketCap: 3080000000000, sector: 'Technology', type: 'stock' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 175.30, change: 3.10, changePercent: 1.80, volume: 23890000, marketCap: 2180000000000, sector: 'Technology', type: 'stock' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 198.70, change: -0.90, changePercent: -0.45, volume: 34120000, marketCap: 2070000000000, sector: 'Consumer Discretionary', type: 'stock' },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 548.30, change: 8.70, changePercent: 1.61, volume: 18940000, marketCap: 1390000000000, sector: 'Technology', type: 'stock' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.40, change: 22.30, changePercent: 2.62, volume: 45670000, marketCap: 2160000000000, sector: 'Technology', type: 'stock' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 172.80, change: -4.20, changePercent: -2.37, volume: 98230000, marketCap: 551000000000, sector: 'Consumer Discretionary', type: 'stock' },
  { symbol: 'BABA', name: 'Alibaba Group', price: 78.30, change: -1.10, changePercent: -1.39, volume: 15670000, marketCap: 192000000000, sector: 'Technology', type: 'stock' },
  { symbol: 'SE', name: 'Sea Limited', price: 48.60, change: 1.20, changePercent: 2.53, volume: 8920000, marketCap: 27300000000, sector: 'Technology', type: 'stock' },
  { symbol: 'GRAB', name: 'Grab Holdings', price: 3.42, change: 0.08, changePercent: 2.40, volume: 12340000, marketCap: 13200000000, sector: 'Technology', type: 'stock' },
  { symbol: 'SPX', name: 'S&P 500', price: 5218.40, change: 15.30, changePercent: 0.29, volume: 0, marketCap: 0, sector: 'Index', type: 'index' },
  { symbol: 'IXIC', name: 'NASDAQ Composite', price: 16421.50, change: 48.20, changePercent: 0.29, volume: 0, marketCap: 0, sector: 'Index', type: 'index' },
  { symbol: 'DJI', name: 'Dow Jones Industrial', price: 39512.80, change: -28.40, changePercent: -0.07, volume: 0, marketCap: 0, sector: 'Index', type: 'index' },
  { symbol: 'STI', name: 'Straits Times Index', price: 3228.60, change: 12.40, changePercent: 0.39, volume: 0, marketCap: 0, sector: 'Index', type: 'index' },
  { symbol: 'SET', name: 'SET Index Thailand', price: 1384.20, change: -5.80, changePercent: -0.42, volume: 0, marketCap: 0, sector: 'Index', type: 'index' },
  { symbol: 'GC', name: 'Gold', price: 2318.40, change: 12.80, changePercent: 0.55, volume: 187430, marketCap: 0, sector: 'Precious Metals', type: 'commodity' },
  { symbol: 'SI', name: 'Silver', price: 29.48, change: 0.32, changePercent: 1.10, volume: 98230, marketCap: 0, sector: 'Precious Metals', type: 'commodity' },
  { symbol: 'CL', name: 'Crude Oil WTI', price: 83.42, change: -0.68, changePercent: -0.81, volume: 432100, marketCap: 0, sector: 'Energy', type: 'commodity' },
  { symbol: 'NG', name: 'Natural Gas', price: 2.14, change: 0.04, changePercent: 1.90, volume: 234500, marketCap: 0, sector: 'Energy', type: 'commodity' },
  { symbol: 'HG', name: 'Copper', price: 4.62, change: -0.03, changePercent: -0.64, volume: 87650, marketCap: 0, sector: 'Industrial Metals', type: 'commodity' },
];

export function generateHistoricalData(symbol: string, basePrice: number): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  let price = basePrice * 0.85;
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const volatility = 0.02;
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    price = Math.max(price + change, 0.01);
    const high = Math.max(open, price) * (1 + Math.random() * 0.01);
    const low = Math.min(open, price) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 50000000 + 10000000);

    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume,
    });
  }
  return data;
}

export function getAllMarketData(): StockData[] {
  return mockMarketData;
}

export function getMarketDataByType(type: 'stock' | 'index' | 'commodity'): StockData[] {
  return mockMarketData.filter(item => item.type === type);
}

export function getHistoricalData(symbol: string): HistoricalDataPoint[] {
  const item = mockMarketData.find(d => d.symbol === symbol);
  const basePrice = item ? item.price : 100;
  return generateHistoricalData(symbol, basePrice);
}

export function getMarketSummary(): MarketSummary {
  const gainers = mockMarketData.filter(d => d.change > 0).length;
  const losers = mockMarketData.filter(d => d.change < 0).length;
  const unchanged = mockMarketData.filter(d => d.change === 0).length;
  return {
    totalAssets: mockMarketData.length,
    gainers,
    losers,
    unchanged,
    lastUpdated: new Date().toISOString(),
  };
}
