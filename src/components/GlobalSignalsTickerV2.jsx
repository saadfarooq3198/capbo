
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Pause, Play } from 'lucide-react';
import { isProduction } from '@/components/lib/loadBase44Sdk';

const categoryStyles = {
  weather: "bg-blue-100 text-blue-800",
  seismic: "bg-orange-100 text-orange-800", 
  conflict: "bg-red-100 text-red-800",
  policy: "bg-gray-200 text-gray-800",
  fx: "bg-green-100 text-green-800",
  commodities: "bg-yellow-100 text-yellow-800",
  port: "bg-purple-100 text-purple-800",
  airport: "bg-cyan-100 text-cyan-800",
  infra_outage: "bg-pink-100 text-pink-800",
  supply_chain: "bg-indigo-100 text-indigo-800",
  business: "bg-teal-100 text-teal-800",
  default: "bg-gray-100 text-gray-800"
};

const FALLBACK_EVENTS = [
  {"id":"fx-20250103-1","ts":"2025-01-03T05:00:00Z","category":"fx","headline":"FX snapshot: USD mixed, CNY stable; minor volatility expected","severity":3,"source_name":"FX Snapshot","source_url":"https://example.org/fx"},
  {"id":"commodities-20250103-1","ts":"2025-01-03T04:58:00Z","category":"commodities","headline":"Brent crude edges higher on supply concerns","severity":3,"source_name":"Market Watch","source_url":"https://example.org/commodities"},
  {"id":"port-20250103-1","ts":"2025-01-03T04:45:00Z","category":"port","headline":"Major ports report normal operations; isolated delays cleared","severity":3,"source_name":"Global Port Ops","source_url":"https://example.org/ports"},
  {"id":"airport-20250103-1","ts":"2025-01-03T04:42:00Z","category":"airport","headline":"Select airports report brief weather diversions; schedules normalizing","severity":3,"source_name":"Aviation Advisory","source_url":"https://example.org/airports"},
  {"id":"infra_outage-20250103-1","ts":"2025-01-03T04:30:00Z","category":"infra_outage","headline":"Cloud provider reports resolved incident; monitoring ongoing","severity":3,"source_name":"Cloud Status","source_url":"https://example.org/cloud"},
  {"id":"supply_chain-20250103-1","ts":"2025-01-03T04:25:00Z","category":"supply_chain","headline":"Spot container rates steady; regional surcharges adjusted","severity":3,"source_name":"Logistics Index","source_url":"https://example.org/sc"},
  {"id":"business-20250103-1","ts":"2025-01-03T04:15:00Z","category":"business","headline":"Tech sector earnings beat expectations; automation investments rising","severity":3,"source_name":"Business Wire","source_url":"https://example.org/business"},
  {"id":"conflict-20250103-1","ts":"2025-01-03T05:20:00Z","category":"conflict","headline":"Border checkpoint disruptions reported; schedules affected","severity":3,"source_name":"OSINT Digest","source_url":"https://example.org/osint"},
  {"id":"policy-20250103-1","ts":"2025-01-03T05:12:00Z","category":"policy","headline":"New tariff review announced for selected industrial machinery","severity":3,"source_name":"Trade Bulletin","source_url":"https://example.org/policy"},
  {"id":"weather-20250103-1","ts":"2025-01-03T05:50:00Z","category":"weather","headline":"Severe storm system tracking across Western Pacific; maritime advisories in effect","severity":4,"source_name":"Global Weather Watch","source_url":"https://example.org/weather"},
  {"id":"seismic-20250103-1","ts":"2025-01-03T05:35:00Z","category":"seismic","headline":"M6.0 earthquake detected; no tsunami threat reported","severity":3,"source_name":"USGS","source_url":"https://example.org/seismic"}
];

export default function GlobalSignalsTickerV2() {
  const [signals, setSignals] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Fetch data only once on component mount
  useEffect(() => {
    const loadSignals = async () => {
      let events = [];
      
      // Skip API call in production on custom domain to avoid 404s
      if (!isProduction()) {
        try {
          const apiResponse = await fetch("/api/ticker", { cache: "no-store" });
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            events = data.data || data || [];
          } else {
            throw new Error('API not available');
          }
        } catch (error) {
          console.log('[CABPOE] Ticker API not available, trying static file');
          // events remains empty here, proceed to static file attempt
        }
      }

      // Try static file if API failed or in production (and thus API was skipped)
      if (events.length === 0) { // Only attempt if events are not yet loaded
        try {
          const BASE_PATH = (document.querySelector("base")?.getAttribute("href") || "/").replace(/\/+$/, "/");
          const fileResponse = await fetch(BASE_PATH + "ticker_daily.json", { cache: "no-store" });
          if (fileResponse.ok) {
            const data = await fileResponse.json();
            events = data.data || data || [];
          } else {
            throw new Error('Static file not available');
          }
        } catch (fileError) {
          console.log("[CABPOE] Using fallback ticker events in production");
          events = FALLBACK_EVENTS;
        }
      }
      
      const processedSignals = (Array.isArray(events) ? events : [])
          .filter(s => s.severity >= 3)
          .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
          .filter((value, index, self) => index === self.findIndex(t => t.id === value.id))
          .slice(0, 50);

      setSignals(processedSignals);
      setIsVisible(processedSignals.length > 0);
    };

    loadSignals();
  }, []);

  if (!isVisible) {
    return null;
  }

  const tickerItems = signals.map((item, index) => (
    <div key={item.id + index} className="inline-flex items-center px-4 whitespace-nowrap">
      <span className={`text-xs font-semibold px-2 py-1 rounded-full mr-3 ${categoryStyles[item.category] || categoryStyles.default}`}>
        {item.category}
      </span>
      <a 
        href={item.source_url} 
        target="_blank" 
        rel="noopener noreferrer nofollow"
        className="text-sm text-gray-700 hover:text-indigo-600 mr-3"
      >
        {item.headline}
      </a>
      <span className="text-xs text-gray-400">{new Date(item.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
  ));

  // Create seamless loop by duplicating content
  const tickerContent = [...tickerItems, ...tickerItems];

  return (
    <>
      <style jsx>{`
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        
        .ticker-container {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 48px;
          background: #FAFAFA;
          border-bottom: 1px solid rgba(0,0,0,0.08);
          margin-bottom: 8px;
          padding: 0 16px;
        }
        
        .ticker-label {
          flex-shrink: 0;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #4f46e5;
          font-size: 14px;
        }
        
        .ticker-track {
          position: relative;
          overflow: hidden;
          flex: 1;
          height: 100%;
          display: flex;
          align-items: center;
        }
        
        .ticker-content {
          display: inline-flex;
          white-space: nowrap;
          animation: tickerScroll 45s linear infinite;
        }
        
        .ticker-content.paused {
          animation-play-state: paused;
        }
        
        .ticker-content:hover {
          animation-play-state: paused;
        }
        
        .ticker-controls {
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }
      `}</style>
      
      <div className="ticker-container">
        <div className="ticker-label">
          <Zap className="h-5 w-5" />
          <span>Global Signals</span>
        </div>
        
        <div className="ticker-track">
          <div className={`ticker-content ${isPaused ? 'paused' : ''}`}>
            {tickerContent}
          </div>
        </div>
        
        <div className="ticker-controls">
          <Button variant="ghost" size="icon" onClick={() => setIsPaused(!isPaused)} className="rounded-full h-8 w-8">
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            <span className="sr-only">{isPaused ? 'Play' : 'Pause'} Ticker</span>
          </Button>
        </div>
      </div>
    </>
  );
}
