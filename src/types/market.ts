export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  type: 'stock' | 'index' | 'commodity';
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSummary {
  totalAssets: number;
  gainers: number;
  losers: number;
  unchanged: number;
  lastUpdated: string;
}
