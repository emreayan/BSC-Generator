
import React, { useState, useEffect } from 'react';
import { Program, QuoteDetails, PortalType } from '../types';
import { MapPin, Clock, Users, Check, Phone, Mail, Globe, Sparkles, Palette, Type, Building2, UserCircle, CalendarDays, Star, Plane, Camera, Save, Download, Loader, Home, Info, GraduationCap } from 'lucide-react';
import { generateEmailDraft } from '../services/geminiService';

interface PrintLayoutProps {
    program: Program;
    quote: QuoteDetails;
    onBack: () => void;
    customLogo: string | null;
    customBanner: string | null;
    timetableImages: string[];
    portalType: PortalType;
    onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveLogoDefault: () => void;
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
        color: '#6499E9',
        classes: {
            textDark: 'text-slate-900',
            textPrimary: 'text-[#6499E9]',
            bgLight: 'bg-[#F0F9FF]',
            bgPrimary: 'bg-[#6499E9]',
            borderLight: 'border-[#9EDDFF]',
            borderPrimary: 'border-[#6499E9]',
            accentText: 'text-[#6499E9]',
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
            accentText: 'text-slate-500',
        }
    }
};

type ThemeKey = keyof typeof THEMES;
type FontKey = keyof typeof FONTS;

// BSC Specific Branding Colors - NEW CYAN/BLUE PALETTE
// BEFFF7 -> A6F6FF -> 9EDDFF -> 6499E9
const BSC_GRADIENT = "bg-[linear-gradient(to_right,#BEFFF7,#A6F6FF,#9EDDFF,#6499E9)]";

// Helper to format text with Markdown-like syntax (bold and italic)
const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index} className="italic">{part.slice(1, -1)}</em>;
        }
        return <span key={index}>{part}</span>;
    });
};

// Helper to clean date strings (replace slash with comma)
const cleanDateString = (dateStr: string) => {
    if (!dateStr) return '';
    let s = String(dateStr);
    // Force replace absolute everyone slash
    while (s.includes('/')) {
        s = s.replace('/', ', ');
    }
    // Clean up double commas if any
    return s.split(',').map(part => part.trim()).filter(Boolean).join(', ');
};

const PrintLayout: React.FC<PrintLayoutProps> = ({ program, quote, onBack, customLogo, customBanner, timetableImages, portalType, onUploadLogo, onSaveLogoDefault }) => {
    const [emailDraft, setEmailDraft] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [logoSaved, setLogoSaved] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Customization State
    const [currentTheme, setCurrentTheme] = useState<ThemeKey>('blue');
    const [currentFont, setCurrentFont] = useState<FontKey>('inter');

    const theme = THEMES[currentTheme].classes;
    const fontStyle = { fontFamily: FONTS[currentFont].family };

    const isGroupPortal = portalType === 'YL_GROUPS';

    // Determine which banner to use: Program specific > Global Custom > Default Gradient
    const displayBanner = program.bannerImage || customBanner;

    // Determine currency symbol based on country
    const currencySymbol = program.country.toLowerCase().includes('malta') ? '€' : '£';

    // Update Document Title for better PDF Filename
    useEffect(() => {
        const originalTitle = document.title;
        // Create a safe filename from program name
        const safeName = program.name.replace(/[^a-z0-9]/gi, '_').replace(/_{2,}/g, '_');
        document.title = `BSC_Teklif_${safeName}`;

        return () => {
            document.title = originalTitle;
        };
    }, [program.name]);

    const formatPrice = (price: string) => {
        if (!price) return '';
        const cleanPrice = price.trim();
        // Check if user already typed a symbol (match common currency symbols)
        if (/^[£$€]/.test(cleanPrice)) {
            return cleanPrice;
        }
        return `${currencySymbol}${cleanPrice}`;
    };

    const handleGenerateEmail = async () => {
        setIsGenerating(true);
        const draft = await generateEmailDraft(program, quote);
        setEmailDraft(draft);
        setIsGenerating(false);
        setShowEmailModal(true);
    };

    const handleDownloadPDF = () => {
        // Set page title to desired filename
        const safeName = program.name
            .replace(/[^a-zA-Z0-9\s]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 50);

        const originalTitle = document.title;
        document.title = `BSC_Teklif_${safeName}`;

        // Scroll to top to ensure correct content is printed
        window.scrollTo(0, 0);

        // Make printable content visible
        const printableContent = document.getElementById('printable-content');
        if (printableContent) {
            printableContent.scrollIntoView({ behavior: 'instant', block: 'start' });
        }

        // Short delay then print (let scroll complete)
        setTimeout(() => {
            window.print();

            // Restore title
            setTimeout(() => {
                document.title = originalTitle;
            }, 1000);
        }, 100);
    };

    const handleSaveLogo = () => {
        onSaveLogoDefault();
        setLogoSaved(true);
        setTimeout(() => setLogoSaved(false), 3000);
    };

    const getTransferDescription = (type: string | undefined) => {
        if (!type) return null;
        if (type === 'Solo') return "Available at all times. Direct transfer to accommodation upon arrival. Includes Meet & Greet.";
        if (type === 'Multi-Person') return "Available 09:00-17:00. Students with similar arrival times collected within a 2-hour window.";
        if (type === 'Accompanied (UM)') return "Includes Unaccompanied Minor (UM) service assistance with airline paperwork and check-in/out.";
        return null;
    };

    const getHeaderTitle = () => {
        switch (portalType) {
            case 'YL_GROUPS': return 'Young Learners Group Program';
            case 'YL_INDIVIDUAL': return 'Young Learners Individual Program';
            case 'ADULTS': return 'Adult Language Training';
            default: return 'Education Program';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 pb-12">
            {/* Design Toolbar - Hides automatically in print mode via .no-print class */}
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
                            type="button"
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="px-4 py-1.5 bg-[#6499E9] text-white rounded-md hover:bg-[#5a8bd5] transition-colors text-sm font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {isDownloading ? 'İndiriliyor...' : 'PDF İndir'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 
          WRAPPER ID="printable-content" 
          The index.html CSS targets THIS ID and hides everything else during print.
      */}
            <div id="printable-content" className="pdf-container mx-auto">
                <div className="w-[210mm] h-[297mm] max-w-[210mm] max-h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none relative overflow-hidden flex flex-col pt-4 px-8" style={fontStyle}>

                    {/* Compact Header */}
                    <div className="flex justify-between items-end mb-1.5 pb-1.5 border-b border-slate-100 pt-4 px-5 shrink-0">
                        <div className="flex flex-col items-start gap-1">
                            {/* Logo Area */}
                            <div className="relative group">
                                {customLogo ? (
                                    <img src={customLogo} alt="Logo" className="h-10 w-auto object-contain" />
                                ) : (
                                    <div className="flex items-center gap-2 text-slate-700">
                                        <div className="bg-[#6499E9] p-1.5 rounded-lg">
                                            <GraduationCap className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="font-bold text-lg tracking-tight leading-none">BSC Education</span>
                                    </div>
                                )}

                                {/* Logo Upload Overlay (Print Hidden) */}
                                <label className="absolute -right-6 -top-2 cursor-pointer bg-white text-slate-500 hover:text-[#6499E9] p-1 rounded-full shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" title="Logoyu Değiştir">
                                    <input type="file" accept="image/*" className="hidden" onChange={onUploadLogo} />
                                    <Camera className="w-3 h-3" />
                                </label>

                                {customLogo && (
                                    <button
                                        onClick={onSaveLogoDefault}
                                        className="absolute -right-6 top-6 cursor-pointer bg-white text-slate-500 hover:text-green-600 p-1 rounded-full shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                        title="Varsayılan Logo Olarak Kaydet"
                                    >
                                        <Save className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase ml-0.5">Young Learners</span>
                        </div>
                        {/* Right: Agency Info */}
                        <div className="text-right flex flex-col gap-0.5 min-w-[140px]">
                            <div className="flex justify-between items-center gap-4 text-[9px] text-slate-600">
                                <span className="font-bold text-slate-800 uppercase tracking-wider">Acente</span>
                                <span className="font-medium truncate max-w-[150px]">{quote.agencyName}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-[9px] text-slate-600">
                                <span className="font-bold text-slate-800 uppercase tracking-wider">Yetkili</span>
                                <span className="font-medium truncate max-w-[150px]">{quote.consultantName}</span>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-[9px] text-slate-600">
                                <span className="font-bold text-slate-800 uppercase tracking-wider">Tarih</span>
                                <div className="flex items-center gap-1">
                                    <CalendarDays className="w-2 h-2" />
                                    <span>{new Date().toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Banner Section */}
                    <div className="mb-4 relative rounded-xl overflow-hidden h-40 shrink-0 shadow-sm print:h-36 group">
                        {/* Background Image */}
                        <img src={program.heroImage} alt={program.name} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />

                        {/* Dark Blue Overlay */}
                        <div className="absolute inset-0 bg-[#0B1221]/80 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1221] via-transparent to-transparent opacity-90"></div>

                        {/* Banner Content */}
                        <div className="absolute inset-0 p-5 flex flex-col justify-end items-start text-white">
                            {/* Location Top */}
                            <div className="flex items-center gap-1.5 mb-1.5 text-[#6499E9] font-bold tracking-wider text-[10px] uppercase">
                                <MapPin className="w-3 h-3" />
                                <span>{program.city}, {program.country}</span>
                            </div>

                            {/* Program Title */}
                            <h1 className="text-3xl print:text-2xl font-black tracking-tight mb-3 text-white leading-none shadow-sm">
                                {program.name}
                            </h1>

                            {/* Info Pills */}
                            <div className="flex items-center gap-2">
                                {/* Program Dates Pill */}
                                <div className="flex items-center gap-1.5 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 text-[10px] text-white/90">
                                    <CalendarDays className="w-3 h-3 text-[#6499E9]" />
                                    <span className="font-medium">
                                        {cleanDateString(program.dates)}
                                    </span>
                                </div>

                                {/* Age Pill */}
                                <div className="flex items-center gap-1.5 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-full px-2.5 py-1 text-[10px] text-white/90">
                                    <Users className="w-3 h-3 text-[#EAB308]" />
                                    <span className="font-medium">{program.ageRange}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-12 gap-8 flex-grow mb-8 px-2">

                        {/* LEFT COLUMN: Features & Services */}
                        <div className="col-span-7 flex flex-col gap-6">

                            {/* Accommodation Highlight */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Home className="w-3.5 h-3.5 text-[#6499E9]" />
                                    Konaklama
                                </h3>
                                <div className="text-sm font-bold text-slate-800 mb-1">{program.accommodationType}</div>
                                <div className="text-[10px] text-slate-500 leading-relaxed">{program.accommodationDetails}</div>
                            </div>

                            {/* Airport Transfer Box (Moved here as requested) */}
                            {quote.transferAirport && (
                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 border-l-4 border-l-[#6499E9]">
                                    <h3 className="text-xs font-bold text-[#6499E9] uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Plane className="w-3.5 h-3.5" />
                                        Havaalanı Transferi
                                    </h3>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-700 text-sm">{quote.transferAirport}</span>
                                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 text-[#6499E9] font-bold uppercase">{quote.transferType}</span>
                                    </div>
                                </div>
                            )}

                            {/* Included Services */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <Check className="w-4 h-4 text-[#6499E9]" />
                                    Dahil Hizmetler
                                </h3>
                                <ul className="grid grid-cols-1 gap-2.5">
                                    {program.includedServices.map((service, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-[11px] text-slate-600 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#9EDDFF] mt-1.5 group-hover:bg-[#6499E9] transition-colors shrink-0"></div>
                                            <span>{formatText(service)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Price & Quote Details */}
                        <div className="col-span-5 flex flex-col gap-4">

                            {/* Travel Dates Box (New Request) */}
                            {quote.startDate && quote.endDate && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <CalendarDays className="w-12 h-12 text-[#6499E9]" />
                                    </div>
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                        <CalendarDays className="w-3.5 h-3.5 text-[#6499E9]" />
                                        Seyahat Tarihleri
                                    </h3>
                                    <div className="text-base font-black text-slate-800 z-10">
                                        {new Date(quote.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        <span className="mx-2 text-slate-300">|</span>
                                        {new Date(quote.endDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        Toplam Süre: <span className="text-[#6499E9] font-bold">{quote.durationWeeks} Hafta</span>
                                    </div>
                                </div>
                            )}

                            {/* Price Box */}
                            <div className="bg-[#0B1221] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-[#6499E9] rounded-full blur-[50px] opacity-20 -mr-10 -mt-10"></div>

                                <div className="relative z-10 text-center">
                                    <p className="text-[#6499E9] font-bold text-xs uppercase tracking-widest mb-1">Kişi Başı Ücret</p>
                                    <div className="text-4xl font-black tracking-tighter mb-1 text-white">
                                        {quote.pricePerStudent}
                                    </div>
                                    <div className="inline-block bg-white/10 px-2 py-0.5 rounded text-[10px] font-medium text-slate-300">
                                        {quote.priceType === 'Gross' ? 'Komisyon Dahil (GROSS)' : 'Net Fiyat'}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <p className="text-slate-400 text-[9px] uppercase font-bold">Öğrenci</p>
                                        <p className="font-bold text-lg">{quote.studentCount}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-[9px] uppercase font-bold">Grup Lideri</p>
                                        <p className="font-bold text-lg">{quote.groupLeaderCount}</p>
                                    </div>
                                </div>

                                {quote.extraLeaderPrice && (
                                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                                        <p className="text-slate-400 text-[9px] uppercase font-bold mb-1">Ek Lider Ücreti</p>
                                        <p className="font-bold text-white">{quote.extraLeaderPrice}</p>
                                    </div>
                                )}
                            </div>

                            {/* Additional Notes */}
                            {quote.notes && (
                                <div className="bg-yellow-50/50 rounded-xl p-4 border border-yellow-100">
                                    <h3 className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        Notlar
                                    </h3>
                                    <p className="text-[10px] text-slate-600 italic leading-relaxed">
                                        {quote.notes}
                                    </p>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Fixed Gallery Grid (2 rows x 4 cols = 8 images) */}
                    <div className="mb-4">
                        <div className="grid grid-cols-4 gap-2">
                            {program.galleryImages.slice(0, 8).map((img, idx) => (
                                <div key={idx} className="aspect-video rounded overflow-hidden border border-gray-100 shadow-sm relative group">
                                    <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                </div>
                            ))}
                            {/* Fill empty slots if less than 8 images */}
                            {[...Array(Math.max(0, 8 - program.galleryImages.length))].map((_, idx) => (
                                <div key={`empty-${idx}`} className="aspect-video rounded bg-slate-50 border border-slate-100 flex items-center justify-center">
                                    <Camera className="w-4 h-4 text-slate-300" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer - Minimal Gradient Line & Info */}
                    <footer className="mt-auto -mx-8">
                        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 px-8 py-2 flex justify-center items-center gap-4 text-[8px] text-slate-800 font-bold border-t border-emerald-100">
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-2.5 h-2.5 text-[#00B092]" />
                                <span>+90 537 473 00 94</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-2.5 h-2.5 text-[#00B092]" />
                                <span>emre.ayan@bsceducation.com</span>
                            </div>
                            <span className="text-slate-300">|</span>
                            <div className="flex items-center gap-1.5">
                                <Globe className="w-2.5 h-2.5 text-[#00B092]" />
                                <span>www.bsceducation.com/young-learners</span>
                            </div>
                        </div>
                    </footer>
                </div>

                {/* --- PAGE 2: TIMETABLES --- */}
                {timetableImages.length > 0 && (
                    <>
                        <div className="print:break-before-page" style={{ pageBreakBefore: 'always' }}></div>
                        <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none print:w-full min-h-[297mm] relative overflow-hidden flex flex-col mt-8 print:mt-0 print:absolute print:top-0 print:left-0" style={fontStyle}>

                            {/* Header Strip Page 2 */}
                            {displayBanner ? (
                                <div className="w-full h-32 md:h-40 shrink-0 overflow-hidden">
                                    <img src={displayBanner} alt="Header Banner" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className={`h-4 w-full shrink-0 ${BSC_GRADIENT}`}></div>
                            )}

                            <div className="p-12 print:p-8 flex-grow flex flex-col">
                                <h2 className={`text-3xl font-extrabold mb-8 uppercase tracking-tight border-b-4 pb-4 ${theme.textDark} ${theme.borderPrimary}`}>
                                    Örnek Program
                                </h2>

                                {/* Special Logic for Explore London */}
                                {program.name.includes('Explore London') ? (
                                    <div className="space-y-12">
                                        {timetableImages[0] && (
                                            <div className="break-inside-avoid">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="px-3 py-1 bg-slate-200 text-slate-700 font-bold rounded text-sm tracking-wider">Option 1</span>
                                                    <h4 className="text-xl font-bold text-slate-700">Standard Package</h4>
                                                </div>
                                                <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-md">
                                                    <img src={timetableImages[0]} alt="Standard Package" className="w-full h-auto" />
                                                </div>
                                            </div>
                                        )}

                                        {timetableImages[1] && (
                                            <div className="break-inside-avoid">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold rounded text-sm tracking-wider">Option 2</span>
                                                    <h4 className="text-xl font-bold text-yellow-600">Gold Package</h4>
                                                </div>
                                                <div className="w-full rounded-xl overflow-hidden border border-yellow-200 shadow-md">
                                                    <img src={timetableImages[1]} alt="Gold Package" className="w-full h-auto" />
                                                </div>
                                            </div>
                                        )}

                                        {timetableImages[2] && (
                                            <div className="break-inside-avoid">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold rounded text-sm tracking-wider">Option 3</span>
                                                    <h4 className="text-xl font-bold text-slate-500">Platinum Package</h4>
                                                </div>
                                                <div className="w-full rounded-xl overflow-hidden border border-slate-300 shadow-md">
                                                    <img src={timetableImages[2]} alt="Platinum Package" className="w-full h-auto" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Default Timetable Layout for other programs
                                    <div className="space-y-8">
                                        {timetableImages.map((img, idx) => (
                                            <div key={idx} className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-md break-inside-avoid">
                                                <img src={img} alt={`Program Timetable ${idx + 1}`} className="w-full h-auto" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer Page 2 */}
                            <footer className={`w-full py-1.5 px-8 shrink-0 mt-auto ${BSC_GRADIENT}`}>
                                <div className="flex justify-start items-center text-xs text-slate-800 font-bold">
                                    <span>{program.name}</span>
                                </div>
                            </footer>
                        </div>
                    </>
                )}
            </div>

            {/* AI Email Modal - No Print */}
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
