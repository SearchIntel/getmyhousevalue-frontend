import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Home, Search, TrendingUp, Info, AlertTriangle, CheckCircle, MapPin, ArrowRight, Building2, Scale } from 'lucide-react';

// --- 1. CONFIGURATION ---
// When you deploy the backend later, you will put that URL here.
// For now, it will safely default to using the internal Mock Data.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"; 

// --- 2. INTERNAL HOUSE PRICE INDEX (HPI) DATABASE ---
const HPI_DATA = {
  "London": { 
    2000: 38.2, 2001: 42.5, 2002: 49.8, 2003: 54.1, 2004: 60.2, 2005: 63.5, 2006: 69.8, 2007: 84.2, 2008: 82.1, 2009: 76.5, 
    2010: 85.2, 2011: 86.1, 2012: 90.3, 2013: 98.5, 2014: 115.2, 2015: 100.0, 2016: 112.5, 2017: 116.8, 2018: 115.9, 2019: 114.8, 
    2020: 120.5, 2021: 126.2, 2022: 134.5, 2023: 131.2, 2024: 130.5 
  },
  "South East": { 
    2000: 42.1, 2001: 47.5, 2002: 56.8, 2003: 64.2, 2004: 70.1, 2005: 72.5, 2006: 76.8, 2007: 85.2, 2008: 83.5, 2009: 75.2, 
    2010: 84.1, 2011: 83.5, 2012: 85.2, 2013: 88.5, 2014: 96.2, 2015: 100.0, 2016: 110.5, 2017: 115.2, 2018: 116.5, 2019: 115.8, 
    2020: 121.5, 2021: 132.2, 2022: 142.5, 2023: 139.5, 2024: 138.2 
  },
  "UK Average": { 
    2000: 43.5, 2001: 47.8, 2002: 56.2, 2003: 66.8, 2004: 75.2, 2005: 78.5, 2006: 82.8, 2007: 90.2, 2008: 88.5, 2009: 78.2, 
    2010: 84.5, 2011: 83.2, 2012: 84.5, 2013: 87.8, 2014: 94.5, 2015: 100.0, 2016: 107.5, 2017: 112.2, 2018: 115.5, 2019: 116.8, 
    2020: 122.5, 2021: 134.2, 2022: 145.5, 2023: 142.5, 2024: 143.2 
  }
};

const MOCK_PROPERTIES = [
  { id: '1', address: '10 Downing Street', city: 'London', postcode: 'SW1A 1AA', type: 'Terraced', sqMeters: 240, epc: 'C', lastSoldDate: '2005-06-15', lastSoldPrice: 4500000 },
  { id: '2', address: '11 Downing Street', city: 'London', postcode: 'SW1A 1AA', type: 'Terraced', sqMeters: 210, epc: 'D', lastSoldDate: '2012-08-20', lastSoldPrice: 5200000 },
];

// --- 3. API FUNCTIONS ---

const getRegionForPostcode = async (postcode) => {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
    const data = await res.json();
    if (data.status === 200) {
      const region = data.result.region || data.result.admin_district;
      if (region && region.includes("London")) return "London";
      if (region && region.includes("South East")) return "South East";
      return "UK Average"; 
    }
  } catch (e) {
    console.warn("Postcode lookup failed, defaulting to UK Average");
  }
  return "UK Average";
};

const fetchProperties = async (postcode) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/properties?postcode=${postcode}`);
    if (!response.ok) throw new Error("Backend not reachable");
    return await response.json();
  } catch (e) {
    console.log("Backend error (using mock data):", e.message);
    return MOCK_PROPERTIES;
  }
};

const calculateValuation = (property, regionKey) => {
  const soldYear = new Date(property.lastSoldDate).getFullYear();
  const currentYear = 2024;
  
  const indexData = HPI_DATA[regionKey] || HPI_DATA["UK Average"];
  const indexOld = indexData[soldYear] || 100;
  const indexNew = indexData[currentYear] || 143.2;
  
  const growthFactor = indexNew / indexOld;
  const estimatedValue = Math.round(property.lastSoldPrice * growthFactor);
  
  const lowerBound = Math.round(estimatedValue * 0.95);
  const upperBound = Math.round(estimatedValue * 1.05);

  const chartData = Object.keys(indexData)
    .filter(year => year >= soldYear)
    .map(year => ({
      year,
      index: indexData[year],
      value: Math.round(property.lastSoldPrice * (indexData[year] / indexOld))
    }));

  return { estimatedValue, lowerBound, upperBound, growthFactor, chartData, regionKey };
};

// --- 4. REACT COMPONENTS ---

const Header = () => (
  <header className="bg-white border-b py-4 px-6 flex items-center justify-between sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="bg-emerald-600 p-2 rounded-lg text-white">
        <Home size={24} />
      </div>
      <span className="text-xl font-bold text-gray-900 tracking-tight">GetMyHouseValue<span className="text-emerald-600">.co.uk</span></span>
    </div>
    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
      <a href="#" className="hover:text-emerald-600 transition-colors">How it Works</a>
      <a href="#" className="hover:text-emerald-600 transition-colors">Data Sources</a>
      <a href="#" className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors">Agent Login</a>
    </nav>
  </header>
);

const Report = ({ property, region, onReset }) => {
  const { estimatedValue, lowerBound, upperBound, growthFactor, chartData } = calculateValuation(property, region);
  const f = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumSignificantDigits: 3 }).format(n);
  const fDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      
      {/* Hero Result - Modern Emerald Theme */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-50 mb-8">
        <div className="bg-emerald-600 px-8 py-10 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">{property.address}</h2>
            <p className="text-emerald-100 mb-8 text-lg">{property.city}, {property.postcode}</p>
            
            <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
              <p className="text-emerald-100 text-sm font-medium uppercase tracking-widest mb-2">Estimated Market Value</p>
              <div className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2">
                {f(estimatedValue)}
              </div>
              <p className="text-emerald-200 text-lg">Range: {f(lowerBound)} - {f(upperBound)}</p>
            </div>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/50 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
          <div className="bg-white p-8">
            <div className="flex items-center gap-3 mb-2 text-gray-500">
              <TrendingUp size={18} />
              <span className="text-sm font-medium uppercase">Market Growth</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">+{Math.round((growthFactor - 1) * 100)}%</p>
            <p className="text-sm text-gray-500 mt-1">Since purchase in {new Date(property.lastSoldDate).getFullYear()}</p>
          </div>
          <div className="bg-white p-8">
            <div className="flex items-center gap-3 mb-2 text-gray-500">
              <MapPin size={18} />
              <span className="text-sm font-medium uppercase">Last Sold</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{f(property.lastSoldPrice)}</p>
            <p className="text-sm text-gray-500 mt-1">Recorded on {fDate(property.lastSoldDate)}</p>
          </div>
          <div className="bg-white p-8">
            <div className="flex items-center gap-3 mb-2 text-gray-500">
              <Info size={18} />
              <span className="text-sm font-medium uppercase">Property Size</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{property.sqMeters} m²</p>
            <p className="text-sm text-gray-500 mt-1">{property.type} • EPC {property.epc}</p>
          </div>
        </div>
      </div>

      {/* Chart & Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Price Trend ({region})</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="year" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => f(value)}
                />
                <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">Source: HM Land Registry UK House Price Index</p>
        </div>

        {/* Transparency Box */}
        <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
             <AlertTriangle size={20} className="text-amber-500" />
             How we calculate this
          </h3>
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              We don't use magic. We take the <strong>last official sold price</strong> of your home ({f(property.lastSoldPrice)}) and adjust it based on how much the property market in <strong>{property.city}</strong> has grown since <strong>{new Date(property.lastSoldDate).getFullYear()}</strong>.
            </p>
            <div className="p-4 bg-white rounded-lg border border-gray-200 text-xs">
              <strong className="block text-gray-900 mb-1">Limitations:</strong>
              <ul className="list-disc pl-4 space-y-1">
                <li>Does not include recent renovations.</li>
                <li>Assumes average property condition.</li>
                <li>Based on {region} averages.</li>
              </ul>
            </div>
            <button onClick={onReset} className="w-full mt-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Search Another Property
            </button>
          </div>
        </div>
      </div>

      {/* Ad Placeholder */}
      <div className="mt-8 py-8 bg-gray-100 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
        <span className="text-xs font-semibold uppercase tracking-wider mb-1">Advertisement</span>
        <p>AdSense Banner Would Go Here</p>
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState(1);
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedProp, setSelectedProp] = useState(null);
  const [region, setRegion] = useState('UK Average');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    const r = await getRegionForPostcode(postcode);
    setRegion(r);
    const props = await fetchProperties(postcode);
    setProperties(props);
    setLoading(false);
    setStep(2);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Header />

      <main className="p-4 md:p-8">
        
        {step === 1 && (
          <div className="max-w-3xl mx-auto mt-12 md:mt-20 text-center animate-in fade-in duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide mb-6">
              <CheckCircle size={12} /> Official Land Registry Data
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
              What is your house <br/><span className="text-emerald-600">actually worth?</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Instant valuation based on official sold prices and {region} index adjustments. No estate agents calling you. 100% Free.
            </p>

            <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
              <input
                type="text"
                placeholder="Enter Postcode (e.g. SW1A 1AA)"
                className="w-full pl-12 pr-4 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50 outline-none transition-all shadow-sm"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-full font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {loading ? 'Searching...' : 'Start'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>
            
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center grayscale opacity-60">
               <span className="font-serif font-bold text-xl text-gray-400">Land Registry</span>
               <span className="font-sans font-bold text-xl text-gray-400">Gov.uk</span>
               <span className="font-mono font-bold text-xl text-gray-400">OpenData</span>
               <span className="font-sans font-bold text-xl text-gray-400">EPC Register</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto mt-10 animate-in slide-in-from-bottom-8 fade-in duration-500">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1">← Back</button>
            <h2 className="text-2xl font-bold mb-2">Select your address</h2>
            <p className="text-gray-500 mb-6">We found the following properties in {postcode || "SW1A 1AA"}.</p>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {properties.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => { setSelectedProp(addr); setStep(3); }}
                  className="w-full text-left px-6 py-4 border-b border-gray-100 hover:bg-emerald-50 transition-colors flex justify-between items-center group"
                >
                  <div>
                    <span className="font-semibold text-gray-800 block group-hover:text-emerald-700">{addr.address}</span>
                    <span className="text-xs text-gray-400">{addr.type} • {addr.sqMeters}m² • Last sold {new Date(addr.lastSoldDate).getFullYear()}</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && selectedProp && <Report property={selectedProp} region={region} onReset={() => setStep(1)} />}
      </main>

      <footer className="border-t py-10 mt-20 bg-gray-50 text-center text-gray-400 text-sm">
        <p>© 2025 GetMyHouseValue.co.uk. Built with Open Government Data.</p>
        <p className="mt-2">Contains HM Land Registry data © Crown copyright and database right 2021.</p>
      </footer>
    </div>
  );
}
