
import React, { useState } from 'react';
import { Program, QuoteDetails, PortalType } from '../types';
import { MapPin, Clock, Users, Check, Phone, Mail, Globe, Sparkles, Palette, Type, Download, Building2, UserCircle, CalendarDays, Star, Plane } from 'lucide-react';
import { generateEmailDraft } from '../services/geminiService';

interface PrintLayoutProps {
  program: Program;
  quote: QuoteDetails;
  onBack: () => void;
  customLogo: string | null;
  customBanner: string | null;
  timetableImages: string[];
  portalType: PortalType;
}

// --- Theme & Font Definitions ---

const FONTS = {
  inter: { name: 'Modern (Inter)', family: "'Inter', sans-serif" },
  playfair: { name: 'Prestij (Playfair)', family: "'Playfair Display', serif" },
  montserrat: { name: 'Geometrik (Montserrat)', family: "'Montserrat', sans-serif" },
  roboto: { name: 'Kurumsal (Roboto)', family: "'Roboto', sans-serif" },
};

const THEMES = {
  blue: {
    name: 'Okyanus',
    color: '#2563eb',
    classes: {
      textDark: 'text-blue-900',
      textPrimary: 'text-blue-600',
      bgLight: 'bg-blue-50',
      bgPrimary: 'bg-blue-600',
      borderLight: 'border-blue-100',
      borderPrimary: 'border-blue-600',
      gradient: 'from-blue-600 to-cyan-500',
      accentText: 'text-cyan-600',
    }
  },
  emerald: {
    name: 'Doğa',
    color: '#059669',
    classes: {
      textDark: 'text-emerald-900',
      textPrimary: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      bgPrimary: 'bg-emerald-600',
      borderLight: 'border-emerald-100',
      borderPrimary: 'border-emerald-600',
      gradient: 'from-emerald-600 to-teal-500',
      accentText: 'text-teal-600',
    }
  },
  rose: {
    name: 'Günbatımı',
    color: '#e11d48',
    classes: {
      textDark: 'text-rose-900',
      textPrimary: 'text-rose-600',
      bgLight: 'bg-rose-50',
      bgPrimary: 'bg-rose-600',
      borderLight: 'border-rose-100',
      borderPrimary: 'border-rose-600',
      gradient: 'from-rose-600 to-orange-500',
      accentText: 'text-orange-600',
    }
  },
  violet: {
    name: 'Kraliyet',
    color: '#7c3aed',
    classes: {
      textDark: 'text-violet-900',
      textPrimary: 'text-violet-600',
      bgLight: 'bg-violet-50',
      bgPrimary: 'bg-violet-600',
      borderLight: 'border-violet-100',
      borderPrimary: 'border-violet-600',
      gradient: 'from-violet-600 to-fuchsia-500',
      accentText: 'text-fuchsia-600',
    }
  },
  slate: {
    name: 'Kurumsal',
    color: '#475569',
    classes: {
      textDark: 'text-slate-900',
      textPrimary: 'text-slate-600',
      bgLight: 'bg-slate-100',
      bgPrimary: 'bg-slate-700',
      borderLight: 'border-slate-200',
      borderPrimary: 'border-slate-600',
      gradient: 'from-slate-700 to-slate-500',
      accentText: 'text-slate-500',
    }
  }
};

type ThemeKey = keyof typeof THEMES;
type FontKey = keyof typeof FONTS;

const PrintLayout: React.FC<PrintLayoutProps> = ({ program, quote, onBack, customLogo, customBanner, timetableImages, portalType }) => {
  const [emailDraft, setEmailDraft] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Customization State
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('blue');
  const [currentFont, setCurrentFont] = useState<FontKey>('inter');

  const theme = THEMES[currentTheme].classes;
  const fontStyle = { fontFamily: FONTS[currentFont].family };

  const isGroupPortal = portalType === 'YL_GROUPS';

  // Determine which banner to use: Program specific > Global Custom > Default Gradient
  const displayBanner = program.bannerImage || customBanner;

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    const draft = await generateEmailDraft(program, quote);
    setEmailDraft(draft);
    setIsGenerating(false);
    setShowEmailModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTransferDescription = (type: string | undefined) => {
    if (!type) return null;
    if (type === 'Solo') return "Available at all times. Direct transfer to accommodation upon arrival. Includes Meet & Greet.";
    if (type === 'Multi-Person') return "Available 09:00-17:00. Students with similar arrival times collected within a 2-hour window.";
    if (type === 'Accompanied (UM)') return "Includes Unaccompanied Minor (UM) service assistance with airline paperwork and check-in/out.";
    return null;
  };

  const getHeaderTitle = () => {
      switch(portalType) {
          case 'YL_GROUPS': return 'Young Learners Program';
          case 'YL_INDIVIDUAL': return 'Individual Language Course';
          case 'ADULTS': return 'Adult Language Training';
          default: return 'Education Program';
      }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Design Toolbar - No Print */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-6 justify-between items-center">
             <div className="flex items-center gap-6">
                <button 
                    onClick={onBack}
                    className="text-gray-500 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
                >
                    &larr; Geri
                </button>
                <div className="h-6 w-px bg-gray-200"></div>
                
                {/* Theme Selector */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-bold tracking-wider">
                        <Palette className="w-4 h-4" /> Tema
                    </div>
                    <div className="flex gap-2">
                        {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setCurrentTheme(key)}
                                className={`w-6 h-6 rounded-full transition-all duration-200 ${currentTheme === key ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                                style={{ backgroundColor: THEMES[key].color }}
                                title={THEMES[key].name}
                            />
                        ))}
                    </div>
                </div>

                {/* Font Selector */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-bold tracking-wider">
                        <Type className="w-4 h-4" /> Yazı Tipi
                    </div>
                     <select 
                        className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                        value={currentFont}
                        onChange={(e) => setCurrentFont(e.target.value as FontKey)}
                    >
                        {(Object.entries(FONTS) as [FontKey, typeof FONTS[FontKey]][]).map(([key, config]) => (
                            <option key={key} value={key}>{config.name}</option>
                        ))}
                    </select>
                </div>
             </div>

             <div className="flex gap-3">
                <button 
                    onClick={handleGenerateEmail}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGenerating ? '...' : 'AI E-Posta'}
                </button>
                <button 
                    onClick={handlePrint}
                    className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all text-sm font-bold flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                    <Download className="w-4 h-4" />
                    PDF İndir
                </button>
             </div>
        </div>
      </div>

      {/* Printable Paper */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full min-h-[297mm] relative overflow-hidden flex flex-col mt-8 print:mt-0" style={fontStyle}>
        
        {/* Header Strip or Banner */}
        {displayBanner ? (
            <div className="w-full h-32 md:h-40 shrink-0 overflow-hidden">
                <img src={displayBanner} alt="Header Banner" className="w-full h-full object-cover" />
            </div>
        ) : (
            <div className={`h-4 bg-gradient-to-r w-full shrink-0 ${theme.gradient}`}></div>
        )}

        <div className="p-12 print:p-8 flex-grow flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-start mb-8">
            <div>
              {customLogo ? (
                <img src={customLogo} alt="Logo" className="max-h-24 max-w-[250px] w-auto object-contain mb-2" />
              ) : (
                <>
                    <h1 className={`text-4xl font-extrabold tracking-tight ${theme.textDark}`}>Bsc Education</h1>
                    <p className={`text-lg font-medium tracking-wide ${theme.textPrimary}`}>{getHeaderTitle()}</p>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 inline-block text-left mb-2">
                 <div className="text-xs text-gray-500 uppercase tracking-wide font-bold mb-1">İletişim</div>
                 <div className="font-bold text-gray-900 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-gray-400" />
                    {quote.consultantName}
                 </div>
                 <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    {quote.agencyName}
                 </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{new Date().toLocaleDateString('tr-TR')}</p>
            </div>
          </header>

          {/* Hero Section (Program Image) */}
          <div className="mb-8 relative rounded-2xl overflow-hidden h-60 shrink-0">
             <img src={program.heroImage} alt={program.name} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                <h2 className="text-3xl font-bold text-white mb-2 shadow-sm">{program.name}</h2>
                <div className="flex items-center text-white/95 gap-2 text-lg font-medium shadow-sm">
                    <MapPin className="w-5 h-5" />
                    <span>{program.city}, {program.country}</span>
                </div>
             </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-2 gap-10 mb-8 flex-grow">
            {/* Left Column: Program Details & Services */}
            <div className="space-y-6">
              {/* Core Details */}
              <div>
                <h3 className={`text-lg font-bold border-b-2 pb-2 mb-4 uppercase tracking-wide ${theme.textDark} ${theme.borderLight}`}>Program Detayları</h3>
                <ul className="space-y-4">
                  <li className={`flex items-start gap-4 p-3 rounded-lg ${theme.bgLight}`}>
                      <Clock className={`w-5 h-5 mt-0.5 shrink-0 ${theme.textPrimary}`} />
                      <div>
                          <span className={`block text-xs uppercase font-bold tracking-wider ${theme.textDark} opacity-70`}>Program Süresi</span>
                          <span className="text-gray-900 font-semibold">{quote.durationWeeks} Hafta</span>
                      </div>
                  </li>
                   <li className={`flex items-start gap-4 p-3 rounded-lg ${theme.bgLight}`}>
                      <Users className={`w-5 h-5 mt-0.5 shrink-0 ${theme.textPrimary}`} />
                      <div>
                          <span className={`block text-xs uppercase font-bold tracking-wider ${theme.textDark} opacity-70`}>Yaş Aralığı</span>
                          <span className="text-gray-900 font-semibold">{program.ageRange}</span>
                      </div>
                  </li>
                  <li className={`flex items-start gap-4 p-3 rounded-lg ${theme.bgLight}`}>
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                          <div className={`w-2 h-2 rounded-full ${theme.bgPrimary}`}></div>
                      </div>
                      <div>
                          <span className={`block text-xs uppercase font-bold tracking-wider ${theme.textDark} opacity-70`}>Konaklama</span>
                          <span className="text-gray-900 font-semibold block">{program.accommodationType}</span>
                          <span className="text-sm text-gray-600 leading-tight">{program.accommodationDetails}</span>
                      </div>
                  </li>
                </ul>
              </div>

              {/* Included Services */}
              <div>
                <h3 className={`text-lg font-bold border-b-2 pb-2 mb-4 uppercase tracking-wide ${theme.textDark} ${theme.borderLight}`}>Dahil Hizmetler</h3>
                <ul className="space-y-2">
                   {program.includedServices.map((service, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
                            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${theme.textPrimary}`} />
                            <span className="leading-snug">{service}</span>
                        </li>
                    ))}
                </ul>
              </div>

               {/* Young Learners Will Section (New) */}
               {program.youngLearnersGoals && program.youngLearnersGoals.length > 0 && (
                  <div>
                    <h3 className={`text-lg font-bold border-b-2 pb-2 mb-4 uppercase tracking-wide ${theme.textDark} ${theme.borderLight}`}>Young Learners Will:</h3>
                    <ul className="space-y-2">
                      {program.youngLearnersGoals.map((goal, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2.5">
                              <Star className={`w-4 h-4 mt-0.5 shrink-0 ${theme.accentText}`} />
                              <span className="leading-snug">{goal}</span>
                          </li>
                      ))}
                    </ul>
                  </div>
               )}
            </div>

            {/* Right Column: Quote & Description */}
            <div className="flex flex-col h-full">
                {/* Quote Box */}
                <div className={`p-6 rounded-xl border mb-6 shadow-sm ${theme.bgLight} ${theme.borderLight}`}>
                    <h3 className={`text-lg font-bold mb-4 border-b pb-2 uppercase tracking-wide ${theme.textDark} ${theme.borderLight}`}>Fiyat ve Detaylar</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-white/50 shadow-sm">
                        <span className="block text-xs text-slate-400 uppercase font-bold mb-1">Öğrenci</span>
                        <div className="flex items-center gap-2">
                           <Users className={`w-5 h-5 ${theme.textPrimary}`} />
                           <span className="text-xl font-bold text-slate-800">{quote.studentCount}</span>
                        </div>
                      </div>
                      
                      {isGroupPortal && (
                        <div className="bg-white p-3 rounded-lg border border-white/50 shadow-sm">
                            <span className="block text-xs text-slate-400 uppercase font-bold mb-1">Grup Lideri</span>
                            <div className="flex items-center gap-2">
                            <Users className={`w-5 h-5 ${theme.accentText}`} />
                            <span className="text-xl font-bold text-slate-800">{quote.groupLeaderCount}</span>
                            </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex flex-col gap-3 border-t pt-4 ${theme.borderLight}`}>
                         <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="text-slate-500 text-sm font-medium">Öğrenci Başı Ücret</span>
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-max ${quote.priceType === 'Net' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {quote.priceType}
                              </span>
                            </div>
                            <span className={`text-3xl font-black ${theme.textPrimary}`}>{quote.pricePerStudent}</span>
                        </div>
                        {isGroupPortal && quote.extraLeaderPrice && (
                            <div className="flex justify-between items-end border-t border-dashed border-gray-300 pt-2">
                                <span className="text-slate-500 text-xs font-medium">Ek Lider Ücreti</span>
                                <span className={`text-lg font-bold ${theme.accentText}`}>{quote.extraLeaderPrice}</span>
                            </div>
                        )}
                    </div>

                    {/* Airport Transfer Section in Quote Box */}
                    {quote.transferAirport && quote.transferType && (
                        <div className={`mt-4 pt-4 border-t ${theme.borderLight}`}>
                            <h4 className={`text-xs uppercase font-bold tracking-wider mb-2 ${theme.textDark} opacity-80 flex items-center gap-1.5`}>
                                <Plane className="w-3.5 h-3.5" /> Havaalanı Transferi
                            </h4>
                            <div className="bg-white/60 p-3 rounded-lg border border-white/50 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-semibold text-slate-800">{quote.transferAirport}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                                        {quote.transferType}
                                     </span>
                                </div>
                                {getTransferDescription(quote.transferType) && (
                                    <p className="text-[10px] text-slate-500 italic leading-tight mt-1 border-t border-slate-100 pt-1">
                                        {getTransferDescription(quote.transferType)}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {quote.notes && (
                        <div className="bg-white/60 p-4 rounded-lg border border-white/50 text-sm text-slate-700 italic relative mt-4">
                            <span className="pl-1 relative z-10">{quote.notes}</span>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div>
                  <h3 className={`text-lg font-bold mb-3 border-b-2 pb-2 uppercase tracking-wide ${theme.textDark} ${theme.borderLight}`}>Program Hakkında</h3>
                  <p className="text-gray-700 leading-relaxed text-sm text-justify">
                      {program.description}
                  </p>
                </div>
            </div>
          </div>

           {/* Timetable Section (Conditional) */}
           {timetableImages.length > 0 && (
                <div className="mb-8 break-inside-avoid">
                    <h3 className={`text-lg font-bold mb-4 border-b-2 pb-2 uppercase tracking-wide ${theme.textDark} ${theme.borderLight}`}>
                         <span className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" /> Örnek Program
                         </span>
                    </h3>
                    
                    {timetableImages.length === 1 ? (
                         <div className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                             <img src={timetableImages[0]} alt="Program Timetable" className="w-full h-auto" />
                         </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {timetableImages.map((img, idx) => (
                                <div key={idx} className="w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                    <img src={img} alt={`Program Timetable ${idx+1}`} className="w-full h-auto" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
           )}

           {/* Gallery Grid (Expanded) */}
           <div className="mt-auto">
             <div className="grid grid-cols-3 gap-3">
                {program.galleryImages.slice(0, 9).map((img, idx) => (
                    <div key={idx} className={`h-24 rounded-lg overflow-hidden border shadow-sm ${theme.borderLight}`}>
                        <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                    </div>
                ))}
             </div>
           </div>
        </div>

        {/* Footer */}
        <footer className={`w-full p-6 print:px-8 shrink-0 text-white ${theme.bgPrimary}`}>
          <div className="flex justify-between items-center">
              <div>
                  {customLogo && <p className="font-bold text-xs uppercase mb-1 opacity-75">İletişim</p>}
                  <h4 className="font-bold text-lg mb-1 tracking-tight">{quote.agencyName || 'Bsc Education'}</h4>
                  <p className="opacity-80 text-xs uppercase tracking-wider">Geleceğinizi şekillendiren eğitim deneyimleri</p>
              </div>
              <div className="flex gap-6 text-xs font-medium opacity-90">
                  <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>+90 212 555 0000</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <span>info@bsceducation.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      <span>www.bsceducation.com</span>
                  </div>
              </div>
          </div>
        </footer>
      </div>

      {/* AI Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Yapay Zeka Tarafından Oluşturulan Taslak
                    </h3>
                    <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    <textarea 
                        className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-sm bg-gray-50"
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                    ></textarea>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button 
                        onClick={() => setShowEmailModal(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Kapat
                    </button>
                    <button 
                         onClick={() => {
                            navigator.clipboard.writeText(emailDraft);
                            alert('Metin kopyalandı!');
                         }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Metni Kopyala
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PrintLayout;
