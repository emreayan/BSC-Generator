
import React, { useState } from 'react';
import { QuoteDetails, Program, PortalType } from '../types';
import { Calculator, Send, Users, Clock, Building2, UserCircle, Plane } from 'lucide-react';

interface QuoteFormProps {
  program: Program;
  onGenerate: (quote: QuoteDetails) => void;
  onCancel: () => void;
  portalType: PortalType;
}

// Rate Matrix based on 2026 Price List (Used for Available Airports only now)
const TRANSFER_RATES: Record<string, Record<string, any>> = {
  'London': {
    'London Heathrow': {},
    'London Gatwick': {},
    'London City': {},
    'London Luton': {},
    'London Stansted': {},
  },
  'Bedford': {
    'London Heathrow': {},
    'London Gatwick': {},
    'London City': {},
    'London Luton': {},
    'London Stansted': {},
  },
  'Manchester': {
    'Manchester Airport': {},
  },
  'Wellington': {
    'Exeter Airport': {},
    'Bristol Airport': {},
  },
  'Malta': {
    'Malta International Airport': {},
  }
};

const QuoteForm: React.FC<QuoteFormProps> = ({ program, onGenerate, onCancel, portalType }) => {
  const [details, setDetails] = useState<QuoteDetails>({
    agencyName: '',
    consultantName: '',
    studentCount: '',
    groupLeaderCount: '0',
    durationWeeks: '',
    pricePerStudent: '',
    priceType: 'Gross',
    extraLeaderPrice: '',
    notes: '',
    transferAirport: '',
    transferType: 'Solo'
  });

  // Determine currency symbol
  const currencySymbol = program.country.toLowerCase().includes('malta') ? '€' : '£';
  const isGroupPortal = portalType === 'YL_GROUPS';

  // Determine available airports based on program city/location
  const getRegionKey = () => {
    if (program.city.includes('London') || program.city.includes('Londra') || program.location.includes('King')) return 'London';
    if (program.city.includes('Bedford')) return 'Bedford';
    if (program.city.includes('Manchester')) return 'Manchester';
    if (program.city.includes('Wellington') || program.location.includes('Wellington')) return 'Wellington';
    if (program.country.includes('Malta')) return 'Malta';
    return 'London'; // Default
  };

  const regionKey = getRegionKey();
  const availableAirports = Object.keys(TRANSFER_RATES[regionKey] || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(details);
  };

  return (
    <div className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Acente ve İletişim Bilgileri */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Acente İsmi</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={details.agencyName}
                onChange={(e) => setDetails({...details, agencyName: e.target.value})}
                placeholder="Örn: Global Eğitim"
              />
              <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">İletişim</label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={details.consultantName}
                onChange={(e) => setDetails({...details, consultantName: e.target.value})}
                placeholder="Örn: Ahmet Yılmaz"
              />
              <UserCircle className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 my-2"></div>

        {/* Sayısal Veriler */}
        <div className={`grid ${isGroupPortal ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Öğrenci Sayısı</label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={details.studentCount}
                onChange={(e) => setDetails({...details, studentCount: e.target.value})}
                placeholder="15"
              />
              <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          {isGroupPortal && (
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Grup Lideri</label>
                <div className="relative">
                <input
                    type="number"
                    required
                    min="0"
                    className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={details.groupLeaderCount}
                    onChange={(e) => setDetails({...details, groupLeaderCount: e.target.value})}
                    placeholder="1"
                />
                <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Süre (Hafta Sayısı)</label>
          <div className="relative">
            <input
              type="number"
              required
              min="1"
              className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={details.durationWeeks}
              onChange={(e) => setDetails({...details, durationWeeks: e.target.value})}
              placeholder="Örn: 2"
            />
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Fiyatlandırma */}
        <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide">
                    Öğrenci Başı Toplam Ücret ({currencySymbol})
                  </label>
                  <div className="flex bg-white rounded-md p-0.5 border border-blue-200">
                      <button 
                        type="button"
                        onClick={() => setDetails({...details, priceType: 'Gross'})}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${details.priceType === 'Gross' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-600'}`}
                      >
                        GROSS
                      </button>
                      <button 
                        type="button"
                        onClick={() => setDetails({...details, priceType: 'Net'})}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${details.priceType === 'Net' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-blue-600'}`}
                      >
                        NET
                      </button>
                  </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-blue-200 text-slate-800 font-bold rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={details.pricePerStudent}
                  onChange={(e) => setDetails({...details, pricePerStudent: e.target.value})}
                  placeholder={`Örn: ${currencySymbol}1,250`}
                />
                <Calculator className="absolute right-3 top-2.5 w-5 h-5 text-blue-400 opacity-50" />
              </div>
            </div>

            {isGroupPortal && (
                <div>
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1.5">
                    Ek Grup Lideri Ücreti ({currencySymbol})
                </label>
                <div className="relative">
                    <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-white border border-blue-200 text-slate-800 font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={details.extraLeaderPrice}
                    onChange={(e) => setDetails({...details, extraLeaderPrice: e.target.value})}
                    placeholder={`Opsiyonel: ${currencySymbol}500`}
                    />
                    <Calculator className="absolute right-3 top-2.5 w-5 h-5 text-blue-400 opacity-50" />
                </div>
                </div>
            )}
        </div>

        {/* Airport Transfer Section */}
        <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 space-y-3">
             <div className="flex items-center gap-2 mb-1">
                 <Plane className="w-4 h-4 text-emerald-600" />
                 <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Havaalanı Transferi</span>
             </div>
             
             <div>
                <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Havaalanı</label>
                <select
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={details.transferAirport}
                    onChange={(e) => setDetails({...details, transferAirport: e.target.value})}
                >
                    <option value="">Seçiniz...</option>
                    {availableAirports.map(airport => (
                        <option key={airport} value={airport}>{airport}</option>
                    ))}
                </select>
             </div>

             <div>
                <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Transfer Tipi</label>
                <select
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={details.transferType}
                    onChange={(e) => setDetails({...details, transferType: e.target.value as any})}
                >
                    <option value="Solo">Solo Transfer</option>
                    <option value="Multi-Person">Multi-Person</option>
                    <option value="Accompanied (UM)">Accompanied (UM)</option>
                </select>
             </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Ek Notlar (Opsiyonel)</label>
          <textarea
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-20 resize-none"
            value={details.notes}
            onChange={(e) => setDetails({...details, notes: e.target.value})}
            placeholder="Vize dahil, uçak bileti hariç..."
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-blue-300 flex items-center justify-center gap-2 mt-2"
        >
          <Send className="w-5 h-5" />
          PDF Önizleme Oluştur
        </button>
      </form>
    </div>
  );
};

export default QuoteForm;
