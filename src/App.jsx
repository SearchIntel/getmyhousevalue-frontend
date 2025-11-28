import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Home, Search, TrendingUp, Info, AlertTriangle, CheckCircle, MapPin, ArrowRight, Building2, Scale, FileText, Database, ShieldCheck, ExternalLink } from 'lucide-react';

// --- CONFIGURATION ---
const BACKEND_URL = "https://getmyhousevalue-backend.onrender.com"; 

// --- INTERNAL DATA ---
const HPI_DATA = {
  "London": { 2000: 38.2, 2010: 85.2, 2015: 100.0, 2020: 120.5, 2024: 130.5 },
  "South East": { 2000: 42.1, 2010: 84.1, 2015: 100.0, 2020: 121.5, 2024: 138.2 },
  "UK Average": { 2000: 43.5, 2010: 84.5, 2015: 100.0, 2020: 122.5, 2024: 143.2 }
};

const MOCK_PROPERTIES = [
  { id: '1', address: '10 Downing Street', city: 'London', postcode: 'SW1A 1AA', type: 'Terraced', sqMeters: 240, epc: 'C', lastSoldDate: '2005-06-15', lastSoldPrice: 4500000 },
];

// --- API FUNCTIONS ---
const getPostcodeDetails = async (inputPostcode) => {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${inputPostcode}`);
    const data = await res.json();
    if (data.status === 200) {
      const region = data.result.region || data.result.admin_district;
      let regionKey = "UK Average";
      if (region && region.includes("London")) regionKey = "London";
      if (region && region.includes("South East")) regionKey = "South East";
      return { regionKey, formattedPostcode: data.result.postcode };
    }
  } catch (e) { console.warn("Postcode lookup failed"); }
  return { regionKey: "UK Average", formattedPostcode: inputPostcode };
};

const fetchProperties = async (postcode) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/properties?postcode=${encodeURIComponent(postcode)}`);
    if (!response.ok) throw new Error("Backend not reachable");
    return await response.json();
  } catch (e) { return MOCK_PROPERTIES; }
};

const calculateValuation = (property, regionKey) => {
  const soldYear = property.lastSoldDate ? new Date(property.lastSoldDate).getFullYear() : 2015; // Default if no date
  const currentYear = 2024;
  const indexData = HPI_DATA[regionKey] || HPI_DATA["UK Average"];
  
  // Use 2015 (Index 100) as base if sold year is unknown or too old/new
  const indexOld = indexData[soldYear] || 100;
  const indexNew = indexData[currentYear] || 143.2;
  
  const growthFactor = indexNew / indexOld;
  
  // If lastSoldPrice is 0 (EPC fallback), we can't calculate growth normally.
  const estimatedValue = property.lastSoldPrice > 0 ? Math.round(property.lastSoldPrice * growthFactor) : 0;
  
  return { 
    estimatedValue, 
    lowerBound: Math.round(estimatedValue * 0.95), 
    upperBound: Math.round(estimatedValue * 1.05), 
    growthFactor 
  };
};

// --- PAGES ---

const InfoPage = ({ title, icon: Icon, children, onBack }) => (
  <div className="max-w-3xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500 px-6">
    <button onClick={onBack} className="mb-6 text-sm text-emerald-600 font-medium hover:underline flex items-center gap-2">
      <ArrowRight className="rotate-180" size={16} /> Back to Search
    </button>
    <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700"><Icon size={24} /></div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="prose prose-emerald text-gray-600 leading-relaxed">
        {children}
      </div>
    </div>
  </div>
);

const Header = ({ setPage }) => (
  <header className="bg-white border-b py-4 px-6 flex items-center justify-between sticky top-0 z-50">
    <button onClick={() => setPage('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="bg-emerald-600 p-2 rounded-lg text-white"><Home size={24} /></div>
      <span className="text-xl font-bold text-gray-900 tracking-tight">GetMyHouseValue<span className="text-emerald-600">.co.uk</span></span>
    </button>
    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
      <button onClick={() => setPage('how-it-works')} className="hover:text-emerald-600 transition-colors">How it Works</button>
      <button onClick={() => setPage('data')} className="hover:text-emerald-600 transition-colors">Data Sources</button>
      <button className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors">Agent Login</button>
    </nav>
  </header>
);

// --- MAIN APP ---

export default function App() {
  const [page, setPage] = useState('home'); // 'home', 'how-it-works', 'data'
  const [step, setStep] = useState(1); // 1=Search, 2=List, 3=Result
  const [postcode, setPostcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedProp, setSelectedProp] = useState(null);
  const [region, setRegion] = useState('UK Average');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    const details = await getPostcodeDetails(postcode);
    setRegion(details.regionKey);
    const props = await fetchProperties(details.formattedPostcode);
    setProperties(props);
    setLoading(false);
    setStep(2);
    setPage('home'); // Ensure we are on the home page view
  };

  const renderContent = () => {
    if (page === 'how-it-works') {
      return (
        <InfoPage title="How it Works" icon={FileText} onBack={() => setPage('home')}>
          <p className="mb-4 text-lg">We use a transparent <strong>"Index-Adjusted"</strong> valuation model. Unlike estate agents who may inflate prices to win your business, we rely purely on official data.</p>
          
          <div className="space-y-6 mt-8">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h3 className="font-bold text-gray-900">Locate Baseline</h3>
                <p className="text-sm">We find the last official sold price of your property from the HM Land Registry archives.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h3 className="font-bold text-gray-900">Identify Region</h3>
                <p className="text-sm">We identify your specific economic region (e.g., South East, London) using ONS geographical data.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h3 className="font-bold text-gray-900">Apply Growth Factor</h3>
                <p className="text-sm">We calculate the percentage growth of the official House Price Index (HPI) for your region from the date of purchase to today.</p>
              </div>
            </div>
          </div>
        </InfoPage>
      );
    }

    if (page === 'data') {
      return (
        <InfoPage title="Data Sources" icon={Database} onBack={() => setPage('home')}>
          <p className="mb-6 text-lg">We are committed to using only <strong>Open Government Data</strong> to ensure neutrality and trust.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="https://use-land-property-data.service.gov.uk/datasets/ppd" target="_blank" rel="noopener noreferrer" className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer block">
              <div className="flex items-center gap-2 mb-3 text-emerald-800 group-hover:text-emerald-600">
                <Scale size={20} />
                <h3 className="font-bold">HM Land Registry</h3>
                <ExternalLink size={14} className="ml-auto opacity-50" />
              </div>
              <p className="text-sm text-gray-600">Used for historical sold prices and transaction dates. Contains HM Land Registry data © Crown copyright and database right 2021.</p>
            </a>
            
            <a href="https://epc.opendatacommunities.org/" target="_blank" rel="noopener noreferrer" className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer block">
              <div className="flex items-center gap-2 mb-3 text-emerald-800 group-hover:text-emerald-600">
                <Building2 size={20} />
                <h3 className="font-bold">EPC Register</h3>
                <ExternalLink size={14} className="ml-auto opacity-50" />
              </div>
              <p className="text-sm text-gray-600">Used to retrieve property square footage and current energy efficiency ratings. Sourced from Open Data Communities.</p>
            </a>
            
            <a href="https://landregistry.data.gov.uk/app/ukhpi" target="_blank" rel="noopener noreferrer" className="p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors group cursor-pointer block">
              <div className="flex items-center gap-2 mb-3 text-emerald-800 group-hover:text-emerald-600">
                <TrendingUp size={20} />
                <h3 className="font-bold">ONS Statistics</h3>
                <ExternalLink size={14} className="ml-auto opacity-50" />
              </div>
              <p className="text-sm text-gray-600">Used for the UK House Price Index (HPI) to calculate regional growth percentages over time.</p>
            </a>
          </div>
        </InfoPage>
      );
    }

    // Default Home Page Logic
    if (step === 1) return (
      <div className="max-w-3xl mx-auto mt-12 md:mt-20 text-center animate-in fade-in duration-700 px-6">
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
          <button type="submit" disabled={loading} className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-full font-medium transition-colors flex items-center gap-2 disabled:opacity-70">
            {loading ? 'Searching...' : 'Start'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    );

    if (step === 2) return (
      <div className="max-w-2xl mx-auto mt-10 animate-in slide-in-from-bottom-8 fade-in duration-500 px-6">
        <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-1">← Back</button>
        <h2 className="text-2xl font-bold mb-2">Select your address</h2>
        <p className="text-gray-500 mb-6">We found the following properties in {postcode.toUpperCase()}.</p>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {properties.length > 0 ? properties.map((addr) => (
            <button key={addr.id} onClick={() => { setSelectedProp(addr); setStep(3); }} className="w-full text-left px-6 py-4 border-b border-gray-100 hover:bg-emerald-50 transition-colors flex justify-between items-center group">
              <div>
                <span className="font-semibold text-gray-800 block group-hover:text-emerald-700">{addr.address}</span>
                <span className="text-xs text-gray-400">{addr.type} • {addr.sqMeters}m² • Last sold {addr.lastSoldDate ? new Date(addr.lastSoldDate).getFullYear() : 'Unknown'}</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all"><ArrowRight size={14} /></div>
            </button>
          )) : <div className="p-8 text-center text-gray-500"><p>No recent sales found.</p><button onClick={() => setStep(1)} className="mt-4 text-emerald-600 hover:underline">Try another postcode</button></div>}
        </div>
      </div>
    );

    if (step === 3 && selectedProp) {
        const { estimatedValue, lowerBound, upperBound, growthFactor } = calculateValuation(selectedProp, region);
        const f = (n) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumSignificantDigits: 3 }).format(n);
        
        return (
            <div className="max-w-4xl mx-auto mt-10 animate-in fade-in px-6">
                <button onClick={() => setStep(2)} className="mb-6 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">← Back to List</button>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-50 mb-8">
                    <div className="bg-emerald-600 px-8 py-10 text-center text-white">
                        <h2 className="text-3xl font-bold mb-2">{selectedProp.address}</h2>
                        <p className="text-emerald-100 mb-6">{selectedProp.postcode}</p>
                        
                        <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                            <p className="text-emerald-100 text-sm font-medium uppercase tracking-widest mb-2">Estimated Market Value</p>
                            {estimatedValue > 0 ? (
                                <>
                                    <div className="text-5xl font-extrabold tracking-tight mb-2">{f(estimatedValue)}</div>
                                    <p className="text-emerald-200">Range: {f(lowerBound)} - {f(upperBound)}</p>
                                </>
                            ) : (
                                <div className="text-white">
                                    <div className="text-3xl font-bold mb-2">Valuation Unavailable</div>
                                    <p className="text-emerald-200 text-sm">Insufficient historical sales data for this specific property.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-white">
                        <div className="p-6 text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Market Growth</div>
                            <div className="text-2xl font-bold text-emerald-600">
                                {estimatedValue > 0 ? `+${Math.round((growthFactor - 1) * 100)}%` : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                                {selectedProp.lastSoldDate ? `Since purchase in ${new Date(selectedProp.lastSoldDate).getFullYear()}` : 'No previous sale record'}
                            </div>
                        </div>
                        <div className="p-6 text-center">
                            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Last Sold</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {selectedProp.lastSoldPrice > 0 ? f
