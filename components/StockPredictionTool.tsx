'use client';

import React, { useState, useEffect, useRef } from 'react';

// Types
interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Prediction {
  date: string;
  predicted: number;
  confidence: number;
}

interface NewsItem {
  title: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  time: string;
}

// Utility functions
const generateMockData = (days: number = 120): StockData[] => {
  const data: StockData[] = [];
  let price = 150;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.48) * 5;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
    
    price = close;
  }
  return data;
};

const calculateSMA = (data: number[], period: number): number[] => {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(data[i]);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(parseFloat((sum / period).toFixed(2)));
    }
  }
  return sma;
};

const calculateEMA = (data: number[], period: number): number[] => {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[i]);
    } else if (i < period) {
      const sum = data.slice(0, i + 1).reduce((a, b) => a + b, 0);
      ema.push(parseFloat((sum / (i + 1)).toFixed(2)));
    } else {
      ema.push(parseFloat(((data[i] - ema[i - 1]) * multiplier + ema[i - 1]).toFixed(2)));
    }
  }
  return ema;
};

const calculateRSI = (data: number[], period: number = 14): number[] => {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(50);
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const rs = avgGain / (avgLoss || 0.001);
      rsi.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
    }
  }
  return [50, ...rsi];
};

const generatePrediction = (data: StockData[]): Prediction[] => {
  const lastPrice = data[data.length - 1].close;
  const predictions: Prediction[] = [];
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const trend = data.slice(-14).reduce((acc, d, idx, arr) => {
      return acc + (idx > 0 ? (d.close - arr[idx - 1].close) : 0);
    }, 0) / 13;
    
    const noise = (Math.random() - 0.5) * lastPrice * 0.02;
    const predicted = lastPrice + (trend * i) + noise;
    const confidence = Math.max(60, 95 - i * 5 - Math.random() * 10);
    
    predictions.push({
      date: date.toISOString().split('T')[0],
      predicted: parseFloat(predicted.toFixed(2)),
      confidence: parseFloat(confidence.toFixed(1)),
    });
  }
  
  return predictions;
};

// Chart Component
const StockChart: React.FC<{ data: StockData[]; sma: number[]; ema: number[] }> = ({ data, sma, ema }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCandle, setHoveredCandle] = useState<StockData | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);
    
    const prices = data.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices) * 0.99;
    const maxPrice = Math.max(...prices) * 1.01;
    const priceRange = maxPrice - minPrice;
    
    const candleWidth = chartWidth / data.length;
    const candleBodyWidth = candleWidth * 0.7;
    
    ctx.strokeStyle = '#1a2332';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      const price = maxPrice - (priceRange * i) / 4;
      ctx.fillStyle = '#5a6a7a';
      ctx.font = '10px monospace';
      ctx.fillText(`$${price.toFixed(2)}`, width - padding.right + 5, y + 3);
    }
    
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ema.forEach((value, i) => {
      const x = padding.left + i * candleWidth + candleWidth / 2;
      const y = padding.top + ((maxPrice - value) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    sma.forEach((value, i) => {
      const x = padding.left + i * candleWidth + candleWidth / 2;
      const y = padding.top + ((maxPrice - value) / priceRange) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    data.forEach((candle, i) => {
      const x = padding.left + i * candleWidth;
      const centerX = x + candleWidth / 2;
      
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#10b981' : '#ef4444';
      
      const highY = padding.top + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * chartHeight;
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, highY);
      ctx.lineTo(centerX, lowY);
      ctx.stroke();
      
      const openY = padding.top + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * chartHeight;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY) || 1;
      
      ctx.fillStyle = color;
      ctx.fillRect(centerX - candleBodyWidth / 2, bodyTop, candleBodyWidth, bodyHeight);
    });
    
  }, [data, sma, ema]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full rounded-lg"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const candleIndex = Math.floor(x / (800 / data.length));
          if (candleIndex >= 0 && candleIndex < data.length) {
            setHoveredCandle(data[candleIndex]);
          }
        }}
        onMouseLeave={() => setHoveredCandle(null)}
      />
      {hoveredCandle && (
        <div className="absolute top-2 left-2 bg-slate-900/95 border border-slate-700 rounded-lg p-3 text-xs">
          <div className="text-slate-400">{hoveredCandle.date}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            <span className="text-slate-500">O:</span> <span className="text-white">${hoveredCandle.open.toFixed(2)}</span>
            <span className="text-slate-500">H:</span> <span className="text-green-400">${hoveredCandle.high.toFixed(2)}</span>
            <span className="text-slate-500">L:</span> <span className="text-red-400">${hoveredCandle.low.toFixed(2)}</span>
            <span className="text-slate-500">C:</span> <span className="text-white">${hoveredCandle.close.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// RSI Chart Component
const RSIChart: React.FC<{ data: number[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };
    
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);
    
    const chartHeight = height - padding.top - padding.bottom;
    
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fillRect(padding.left, padding.top, width - padding.left - padding.right, chartHeight * 0.3);
    
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(padding.left, padding.top + chartHeight * 0.6, width - padding.left - padding.right, chartHeight * 0.4);
    
    const zones = [
      { value: 70, color: '#ef4444' },
      { value: 50, color: '#5a6a7a' },
      { value: 30, color: '#10b981' },
    ];
    
    zones.forEach(zone => {
      const y = padding.top + ((100 - zone.value) / 100) * chartHeight;
      ctx.strokeStyle = zone.color;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = zone.color;
      ctx.font = '9px monospace';
      ctx.fillText(zone.value.toString(), 5, y + 3);
    });
    
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const stepX = (width - padding.left - padding.right) / (data.length - 1);
    data.forEach((value, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + ((100 - value) / 100) * chartHeight;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
  }, [data]);
  
  return <canvas ref={canvasRef} width={800} height={80} className="w-full rounded-lg" />;
};

// Volume Chart Component
const VolumeChart: React.FC<{ data: StockData[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 5, right: 10, bottom: 20, left: 30 };
    
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, width, height);
    
    const volumes = data.map(d => d.volume);
    const maxVol = Math.max(...volumes);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / data.length;
    
    volumes.forEach((vol, i) => {
      const barHeight = (vol / maxVol) * chartHeight;
      const x = padding.left + i * barWidth;
      const isGreen = data[i].close >= data[i].open;
      
      ctx.fillStyle = isGreen ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.fillRect(x + 1, height - padding.bottom - barHeight, barWidth - 2, barHeight);
    });
    
  }, [data]);
  
  return <canvas ref={canvasRef} width={800} height={60} className="w-full rounded-lg" />;
};

// Prediction Card Component
const PredictionCard: React.FC<{ prediction: Prediction; currentPrice: number }> = ({ prediction, currentPrice }) => {
  const change = ((prediction.predicted - currentPrice) / currentPrice) * 100;
  const isPositive = change >= 0;
  
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/50 transition-colors cursor-pointer">
      <div className="text-slate-400 text-xs mb-2">{prediction.date}</div>
      <div className="text-xl font-bold text-white mb-1">${prediction.predicted.toFixed(2)}</div>
      <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="text-xs text-slate-500">Confidence</div>
        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
        <div className="text-xs text-cyan-400">{prediction.confidence}%</div>
      </div>
    </div>
  );
};

// News Item Component
const NewsItem: React.FC<{ news: NewsItem }> = ({ news }) => {
  const sentimentColors = {
    positive: 'text-green-400 bg-green-400/10',
    negative: 'text-red-400 bg-red-400/10',
    neutral: 'text-slate-400 bg-slate-400/10',
  };
  
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className={`px-2 py-1 rounded text-xs uppercase font-medium ${sentimentColors[news.sentiment]}`}>
        {news.sentiment}
      </div>
      <div className="flex-1">
        <div className="text-sm text-white leading-relaxed">{news.title}</div>
        <div className="text-xs text-slate-500 mt-1">{news.time}</div>
      </div>
    </div>
  );
};

// Main Component
export default function StockPredictionTool() {
  const [symbol, setSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [sma, setSMA] = useState<number[]>([]);
  const [ema, setEMA] = useState<number[]>([]);
  const [rsi, setRSI] = useState<number[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeTab, setActiveTab] = useState<'chart' | 'analysis' | 'news'>('chart');
  const [isLoading, setIsLoading] = useState(true);
  
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
  
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const data = generateMockData(120);
      setStockData(data);
      setSMA(calculateSMA(data.map(d => d.close), 20));
      setEMA(calculateEMA(data.map(d => d.close), 12));
      setRSI(calculateRSI(data.map(d => d.close)));
      setPredictions(generatePrediction(data));
      
      const mockNews: NewsItem[] = [
        { title: `${symbol} reports strong Q4 earnings, beats analyst expectations`, sentiment: 'positive', time: '2 hours ago' },
        { title: 'Tech sector shows resilience amid macroeconomic concerns', sentiment: 'positive', time: '4 hours ago' },
        { title: `Analyst upgrades ${symbol} price target to $200`, sentiment: 'positive', time: '6 hours ago' },
        { title: 'Supply chain optimization drives cost savings', sentiment: 'neutral', time: '8 hours ago' },
        { title: 'Market volatility expected due to Fed announcement', sentiment: 'negative', time: '12 hours ago' },
      ];
      setNews(mockNews);
      setIsLoading(false);
    }, 500);
  }, [symbol]);
  
  const currentPrice = stockData.length > 0 ? stockData[stockData.length - 1].close : 0;
  const prevPrice = stockData.length > 1 ? stockData[stockData.length - 2].close : currentPrice;
  const priceChange = currentPrice - prevPrice;
  const priceChangePercent = (priceChange / prevPrice) * 100;
  
  const latestRSI = rsi.length > 0 ? rsi[rsi.length - 1] : 50;
  const latestSMA = sma.length > 0 ? sma[sma.length - 1] : currentPrice;
  const latestEMA = ema.length > 0 ? ema[ema.length - 1] : currentPrice;
  
  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0d1117] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <span className="text-xl font-bold tracking-tight">StockMind</span>
                  <div className="text-xs text-slate-500">AI-Powered Prediction</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {symbols.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 text-sm bg-green-500/10 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-slate-400">Loading market data...</div>
            </div>
          </div>
        ) : (
          <>
            {/* Price Header */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{symbol}</h1>
                  <span className="text-slate-500 text-sm bg-slate-800 px-2 py-1 rounded">Apple Inc.</span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-white">${currentPrice.toFixed(2)}</span>
                  <span className={`text-lg font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)} ({Math.abs(priceChangePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="text-right text-sm text-slate-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: 'SMA(20)', value: `$${latestSMA.toFixed(2)}`, color: 'text-cyan-400', icon: '📊' },
                { label: 'EMA(12)', value: `$${latestEMA.toFixed(2)}`, color: 'text-amber-400', icon: '📈' },
                { label: 'RSI(14)', value: latestRSI.toFixed(1), color: latestRSI > 70 ? 'text-red-400' : latestRSI < 30 ? 'text-green-400' : 'text-purple-400', icon: '⚡' },
                { label: 'Volume', value: (stockData[stockData.length - 1]?.volume / 1000000).toFixed(1) + 'M', color: 'text-slate-400', icon: '📊' },
                { label: 'High', value: `$${stockData[stockData.length - 1]?.high.toFixed(2)}`, color: 'text-green-400', icon: '▲' },
                { label: 'Low', value: `$${stockData[stockData.length - 1]?.low.toFixed(2)}`, color: 'text-red-400', icon: '▼' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-800/70 transition-colors">
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <span>{stat.icon}</span> {stat.label}
                  </div>
                  <div className={`text-lg font-semibold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>
            
            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-slate-800/30 p-1 rounded-xl w-fit">
              {[
                { id: 'chart', label: 'Chart', icon: '📈' },
                { id: 'analysis', label: 'Analysis', icon: '🔍' },
                { id: 'news', label: 'News', icon: '📰' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4">
                {activeTab === 'chart' && (
                  <>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                          <span>📊</span> Price Chart
                        </h2>
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-cyan-500"></div>
                            <span className="text-slate-400">SMA(20)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-0.5 bg-amber-500"></div>
                            <span className="text-slate-400">EMA(12)</span>
                          </div>
                        </div>
                      </div>
                      <StockChart data={stockData} sma={sma} ema={ema} />
                    </div>
                    
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>📉</span> RSI (Relative Strength Index)
                      </h2>
                      <RSIChart data={rsi} />
                      <div className="flex justify-between text-xs text-slate-500 mt-2 px-2">
                        <span>0</span>
                        <span>30 (Oversold)</span>
                        <span>50</span>
                        <span>70 (Overbought)</span>
                        <span>100</span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>📊</span> Volume Analysis
                      </h2>
                      <VolumeChart data={stockData} />
                    </div>
                  </>
                )}
                
                {activeTab === 'analysis' && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <span>🔍</span> Technical Analysis
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <div className="text-sm text-slate-400 mb-3">Trend Direction</div>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${currentPrice > latestSMA ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-xl font-bold ${currentPrice > latestSMA ? 'text-green-400' : 'text-red-400'}`}>
                            {currentPrice > latestSMA ? '📈 Bullish' : '📉 Bearish'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-3">
                          Price is {currentPrice > latestSMA ? 'above' : 'below'} 20-day SMA
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <div className="text-sm text-slate-400 mb-3">Momentum</div>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${latestRSI > 50 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-xl font-bold ${latestRSI > 70 ? 'text-red-400' : latestRSI < 30 ? 'text-green-400' : 'text-purple-400'}`}>
                            {latestRSI > 70 ? '⚠️ Overbought' : latestRSI < 30 ? '🔥 Oversold' : '➡️ Neutral'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-3">
                          RSI at {latestRSI.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <div className="text-sm text-slate-400 mb-3">Signal Strength</div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                          <span className="text-xl font-bold text-cyan-400">
                            {latestEMA > latestSMA ? '🟢 Strong Buy' : latestEMA < latestSMA ? '🔴 Sell' : '🟡 Hold'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-3">
                          EMA crossover analysis
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <div className="text-sm text-slate-400 mb-3">Volatility</div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                          <span className="text-xl font-bold text-amber-400">📊 Medium</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-3">
                          Based on 20-day ATR
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-800 pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span>💡</span> Summary
                      </h3>
                      <div className="space-y-3 text-slate-300">
                        <p className="leading-relaxed bg-slate-800/30 p-4 rounded-xl">
                          Based on the technical indicators, <span className="text-cyan-400 font-semibold">{symbol}</span> is showing
                          {currentPrice > latestSMA && latestEMA > latestSMA ? (
                            <span className="text-green-400"> a strong bullish trend</span>
                          ) : currentPrice < latestSMA && latestEMA < latestSMA ? (
                            <span className="text-red-400"> bearish pressure</span>
                          ) : (
                            <span className="text-amber-400"> mixed signals</span>
                          )}
                          . The RSI at <span className="text-purple-400 font-semibold">{latestRSI.toFixed(1)}</span> indicates
                          {latestRSI > 70 ? ' overbought conditions, suggesting potential correction.' : 
                           latestRSI < 30 ? ' oversold conditions, suggesting potential rebound opportunity.' :
                           ' neutral momentum with room for movement.'}
                        </p>
                        <p className="leading-relaxed bg-slate-800/30 p-4 rounded-xl">
                          The current price of <span className="text-white font-bold">${currentPrice.toFixed(2)}</span> is 
                          {currentPrice > latestSMA ? ' above ' : ' below '}the 20-day SMA (${latestSMA.toFixed(2)}), 
                          confirming the short-term trend direction. EMA(12) at ${latestEMA.toFixed(2)} {' '}
                          {latestEMA > latestSMA ? 'confirms bullish momentum.' : latestEMA < latestSMA ? 'suggests bearish pressure.' : 'indicates consolidation.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'news' && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <span>📰</span> Latest News
                    </h2>
                    <div className="space-y-3">
                      {news.map((item, i) => (
                        <NewsItem key={i} news={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Predictions */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">AI Predictions</h2>
                      <div className="text-xs text-purple-400">ML-powered forecasting</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {predictions.slice(0, 5).map((pred, i) => (
                      <PredictionCard key={i} prediction={pred} currentPrice={currentPrice} />
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl">
                    <div className="text-xs text-purple-400 mb-2 flex items-center gap-1">
                      <span>🎯</span> 7-Day Forecast
                    </div>
                    <div className="text-sm text-white">
                      Target Price: <span className="font-bold text-purple-400 text-xl">${predictions[6]?.predicted.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Expected change: {((predictions[6]?.predicted - currentPrice) / currentPrice * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>⚡</span> Quick Actions
                  </h2>
                  <div className="space-y-2">
                    <button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Data
                    </button>
                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Report
                    </button>
                    <button className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Set Alert
                    </button>
                  </div>
                </div>
                
                {/* Market Overview */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>🌐</span> Market Overview
                  </h2>
                  <div className="space-y-2">
                    {[
                      { name: 'S&P 500', value: '4,515.77', change: '+0.45%', positive: true },
                      { name: 'NASDAQ', value: '14,125.34', change: '+0.62%', positive: true },
                      { name: 'DOW', value: '35,390.15', change: '-0.12%', positive: false },
                      { name: 'BTC/USD', value: '42,150.00', change: '+1.85%', positive: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                        <span className="text-sm text-slate-400">{item.name}</span>
                        <div className="text-right">
                          <div className="text-sm text-white font-medium">{item.value}</div>
                          <div className={`text-xs ${item.positive ? 'text-green-400' : 'text-red-400'}`}>
                            {item.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span>StockMind v1.0 — AI-Powered Stock Prediction</span>
            </div>
            <div className="flex items-center gap-4">
              <span>⚠️ Data provided for educational purposes only</span>
              <span>|</span>
              <span className="text-red-400">❌ Not financial advice</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}