import React, { useState, useEffect, useRef } from 'react';
import { Program, AppView, QuoteDetails, PortalType } from './types';
import ProgramCard from './components/ProgramCard';
import QuoteForm from './components/QuoteForm';
import PrintLayout from './components/PrintLayout';
import AdminPanel from './components/AdminPanel';
import { programService } from './services/programService';
import { storageService } from './services/storageService';
import { compressImage } from './services/imageUtils';
import { ChevronLeft, MapPin, Calendar, Users, Home, Check, GraduationCap, Settings, Image as ImageIcon, Upload, Save, Trash2, RotateCcw, CalendarDays, LockKeyhole, Plus, X, LayoutGrid, User, Briefcase, Camera, Database, Clock, Star } from 'lucide-react';

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

const App: React.FC = () => {
    const [view, setView] = useState<AppView>(AppView.LANDING);
    const [currentPortal, setCurrentPortal] = useState<PortalType>('YL_GROUPS');

    // Programs State
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);

    // Custom Branding State
    const [customLogo, setCustomLogo] = useState<string | null>(null);
    const [customBanner, setCustomBanner] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Session State (Can be saved to defaults)
    const [timetableImages, setTimetableImages] = useState<string[]>([]);
    const [currentGalleryImages, setCurrentGalleryImages] = useState<string[]>([]);
    const [programBanner, setProgramBanner] = useState<string>(''); // Session banner for specific program
    const [heroImage, setHeroImage] = useState<string>(''); // Session hero image
    const [isDraggingGallery, setIsDraggingGallery] = useState(false);

    // Save Status State: 'idle' | 'saving' | 'success'
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    // --- REFS FOR AUTO-SAVE (To access latest state inside interval) ---
    const heroImageRef = useRef(heroImage);
    const galleryRef = useRef(currentGalleryImages);
    const timetableRef = useRef(timetableImages);
    const bannerRef = useRef(programBanner);
    const saveStatusRef = useRef(saveStatus);

    // Keep refs synced with state
    useEffect(() => {
        heroImageRef.current = heroImage;
        galleryRef.current = currentGalleryImages;
        timetableRef.current = timetableImages;
        bannerRef.current = programBanner;
        saveStatusRef.current = saveStatus;
    }, [heroImage, currentGalleryImages, timetableImages, programBanner, saveStatus]);

    // Load defaults from Supabase on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await programService.fetchSettings();
                if (settings) {
                    if (settings.logoUrl) setCustomLogo(settings.logoUrl);
                    if (settings.bannerUrl) setCustomBanner(settings.bannerUrl);
                }
            } catch (e) {
                console.error("Error loading settings from Supabase", e);
            }
        };
        loadSettings();
    }, []);

    // Load programs whenever currentPortal changes
    useEffect(() => {
        loadProgramsForPortal(currentPortal);
    }, [currentPortal]);

    // --- AUTO SAVE INTERVAL (5 Minutes) ---
    useEffect(() => {
        // Only run auto-save if we are in DETAIL view and have a selected program
        if (view !== AppView.DETAIL || !selectedProgram) return;

        const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 Minutes

        const timer = setInterval(async () => {
            // Don't auto-save if already saving
            if (saveStatusRef.current === 'saving') return;

            console.log("Auto-saving program defaults...");

            // Construct the program object from REFS (latest data)
            const updatedProgram: Program = {
                ...selectedProgram,
                galleryImages: galleryRef.current,
                timetableImages: timetableRef.current,
                bannerImage: bannerRef.current,
                heroImage: heroImageRef.current
            };

            try {
                setSaveStatus('saving');
                const savedRecord = await programService.saveProgram(updatedProgram, currentPortal);

                if (savedRecord) {
                    setPrograms(prev => {
                        const index = prev.findIndex(p => p.id === updatedProgram.id);
                        if (index !== -1) {
                            const newArr = [...prev];
                            newArr[index] = savedRecord;
                            return newArr;
                        }
                        // UUID update check
                        const tempIndex = prev.findIndex(p => p.id === selectedProgram.id);
                        if (tempIndex !== -1) {
                            const newArr = [...prev];
                            newArr[tempIndex] = savedRecord;
                            return newArr;
                        }
                        return [...prev, savedRecord];
                    });

                    setSelectedProgram(savedRecord);
                    setSaveStatus('success');

                    setTimeout(() => {
                        setSaveStatus('idle');
                    }, 3000);
                }
            } catch (e) {
                console.error("Auto-save failed", e);
                setSaveStatus('idle');
            }

        }, AUTO_SAVE_INTERVAL);

        return () => clearInterval(timer);
    }, [view, selectedProgram, currentPortal]); // Dependencies that define the "Session"

    const loadProgramsForPortal = async (portal: PortalType) => {
        setIsLoading(true);
        try {
            // 1. Try to restore missing programs first
            await programService.restoreMissingPrograms(portal);

            // 2. Fetch all programs (including newly restored ones)
            const data = await programService.fetchPrograms(portal);
            setPrograms(data);
        } catch (error) {
            console.error("Error loading programs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePortalSelect = (portal: PortalType) => {
        setCurrentPortal(portal);
        setView(AppView.LIST);
    };

    const handleProgramSelect = (program: Program) => {
        setSelectedProgram(program);
        setCurrentGalleryImages(program.galleryImages || []);
        setTimetableImages(program.timetableImages || []);
        setProgramBanner(program.bannerImage || '');
        setHeroImage(program.heroImage || '');
        setSaveStatus('idle'); // Reset status on new selection
        setView(AppView.DETAIL);
        window.scrollTo(0, 0);
    };

    const handleGenerateQuote = (quote: QuoteDetails) => {
        setQuoteDetails(quote);
        setView(AppView.PRINT);
    };

    const handleBackToDetail = () => {
        setView(AppView.DETAIL);
    };

    const handleBackToList = () => {
        setSelectedProgram(null);
        setQuoteDetails(null);
        setTimetableImages([]);
        setCurrentGalleryImages([]);
        setProgramBanner('');
        setHeroImage('');
        setSaveStatus('idle');
        setView(AppView.LIST);
        window.scrollTo(0, 0);
    };

    const handleBackToLanding = () => {
        setView(AppView.LANDING);
    };

    const handleNewQuote = () => {
        if (window.confirm('Mevcut fiyatlandırma bilgileri silinecektir. Emin misiniz?')) {
            setQuoteDetails(null);
            setView(AppView.DETAIL);
        }
    };

    // --- Program Specific Default Saving ---
    const handleSaveProgramDefaults = async () => {
        if (!selectedProgram) return;

        const updatedProgram: Program = {
            ...selectedProgram,
            galleryImages: currentGalleryImages,
            timetableImages: timetableImages,
            bannerImage: programBanner,
            heroImage: heroImage
        };

        setSaveStatus('saving');
        try {
            const savedRecord = await programService.saveProgram(updatedProgram, currentPortal);

            if (savedRecord) {
                // Update local state with the REAL record from DB (UUID matched)
                setPrograms(prev => {
                    const index = prev.findIndex(p => p.id === updatedProgram.id);
                    if (index !== -1) {
                        const newArr = [...prev];
                        newArr[index] = savedRecord;
                        return newArr;
                    }
                    // If we were editing a temporary ID but got back a UUID
                    const tempIndex = prev.findIndex(p => p.id === selectedProgram.id);
                    if (tempIndex !== -1) {
                        const newArr = [...prev];
                        newArr[tempIndex] = savedRecord;
                        return newArr;
                    }
                    return [...prev, savedRecord];
                });

                setSelectedProgram(savedRecord); // IMPORTANT: Update selected program to use the new UUID

                // Show Success State
                setSaveStatus('success');

                // Revert back to idle after 3 seconds
                setTimeout(() => {
                    setSaveStatus('idle');
                }, 3000);
            }
        } catch (e) {
            console.error(e);
            setSaveStatus('idle'); // Revert on error
        }
    };

    // --- Admin Logic ---
    const handleAdminSave = async (savedProgram: Program) => {
        try {
            const result = await programService.saveProgram(savedProgram, currentPortal);
            if (result) {
                setPrograms(prev => {
                    const exists = prev.find(p => p.id === result.id);
                    if (exists) return prev.map(p => p.id === result.id ? result : p);
                    return [...prev, result];
                });
                return true;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
        return false;
    };

    const handleAdminDelete = async (id: string) => {
        try {
            const success = await programService.deleteProgram(id);
            if (success) {
                setPrograms(prev => prev.filter(p => p.id !== id));
            }
        } catch (e) {
            alert('Silme hatası.');
        }
    };

    const handleSeedDatabase = async () => {
        if (window.confirm('Bu işlem mevcut portal için varsayılan program verilerini veri tabanına yükleyecektir. Onaylıyor musunuz?')) {
            setIsLoading(true);
            try {
                await programService.seedDatabase(currentPortal);
                await loadProgramsForPortal(currentPortal);
                alert('Başlangıç verileri yüklendi.');
            } catch (e) {
                alert('Hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        }
    }

    const handleResetAndRestore = async () => {
        if (window.confirm('DİKKAT: Bu işlem mevcut portaldaki TÜM verileri silecek ve orijinal fabrika ayarlarına (data.ts) döndürecektir. Onaylıyor musunuz?')) {
            setIsLoading(true);
            try {
                await programService.resetAndSeedDatabase(currentPortal);
                await loadProgramsForPortal(currentPortal);
                alert('Tüm programlar başarıyla sıfırlandı ve geri yüklendi.');
            } catch (e) {
                alert('Sıfırlama işlemi sırasında hata oluştu.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // --- File Upload Handlers (Using Supabase Storage) ---
    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file, 500);
                // Upload to storage
                const publicUrl = await storageService.uploadImage(compressed, 'branding/logos');
                setCustomLogo(publicUrl);
            } catch (e) {
                alert("Görsel yüklenirken hata oluştu.");
            }
        }
    };

    // Save Logo as default to Supabase
    const handleSaveLogoDefault = async () => {
        if (customLogo) {
            try {
                await programService.saveSettings({ logoUrl: customLogo });
            } catch (e) {
                alert("Logo kaydedilemedi.");
            }
        }
    };

    const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file, 1200);
                const publicUrl = await storageService.uploadImage(compressed, 'branding/banners');
                setCustomBanner(publicUrl);
            } catch (e) {
                alert("Görsel yüklenirken hata oluştu.");
            }
        }
    };

    const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const compressed = await compressImage(file, 1200, 0.8);
                const publicUrl = await storageService.uploadImage(compressed, `programs/${selectedProgram?.id}/hero`);
                setHeroImage(publicUrl);
            } catch (e) {
                alert("Görsel yüklenirken hata oluştu.");
            }
        }
    };

    const handleTimetableUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            if (timetableImages.length + files.length > 5) {
                alert("En fazla 5 adet çizelge görseli yükleyebilirsiniz.");
                return;
            }

            Array.from(files).forEach(async (file) => {
                try {
                    const compressed = await compressImage(file as File, 1000);
                    const publicUrl = await storageService.uploadImage(compressed, `programs/${selectedProgram?.id}/timetables`);
                    setTimetableImages(prev => [...prev, publicUrl]);
                } catch (e) {
                    console.error("Image upload failed", e);
                }
            });
        }
    };

    const removeTimetableImage = (index: number) => {
        setTimetableImages(prev => prev.filter((_, i) => i !== index));
    };

    // --- Gallery Drag & Drop Logic ---
    const handleGalleryDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingGallery(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processGalleryFiles(e.dataTransfer.files);
        }
    };

    const handleGalleryFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processGalleryFiles(e.target.files);
        }
    };

    const processGalleryFiles = (files: FileList) => {
        // Enforce 8 image limit
        if (currentGalleryImages.length + files.length > 8) {
            alert('Galeriye en fazla 8 adet görsel ekleyebilirsiniz.');
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                compressImage(file, 800, 0.7)
                    .then(async (compressed) => {
                        const publicUrl = await storageService.uploadImage(compressed, `programs/${selectedProgram?.id}/gallery`);
                        setCurrentGalleryImages(prev => [...prev, publicUrl]);
                    })
                    .catch(e => {
                        console.error("Gallery image upload error", e);
                    });
            }
        }
    };

    const removeGalleryImage = (indexToRemove: number) => {
        setCurrentGalleryImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };
    // --------------------------------

    const handleSaveDefaults = async () => {
        try {
            await programService.saveSettings({
                logoUrl: customLogo,
                bannerUrl: customBanner
            });
            alert("Ayarlar Supabase'e kaydedildi.");
            setShowSettings(false);
        } catch (error) {
            alert("Hata: Ayarlar kaydedilemedi.");
        }
    };

    const handleClearDefaults = async () => {
        if (window.confirm("Kayıtlı varsayılan görseller silinsin mi?")) {
            try {
                await programService.saveSettings({ logoUrl: null, bannerUrl: null });
                setCustomLogo(null);
                setCustomBanner(null);
                alert("Varsayılan ayarlar temizlendi.");
            } catch (e) {
                alert("Temizleme hatası.");
            }
        }
    };

    // Helper for button class
    const getSaveButtonClass = (baseColor: string) => {
        // If success, enforce green and full opacity
        if (saveStatus === 'success') return 'bg-green-600 hover:bg-green-700 text-white shadow-green-200 opacity-100 cursor-default';
        // If saving, greyed out
        if (saveStatus === 'saving') return 'bg-gray-400 text-white cursor-not-allowed';

        // Default styles based on context
        if (baseColor === 'purple') return 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200';
        if (baseColor === 'slate') return 'bg-slate-100 hover:bg-slate-200 text-slate-600';

        // NEW PALETTE LOGIC
        if (baseColor === 'emerald' || baseColor === 'orange') return 'bg-[#6499E9] hover:bg-[#5a8bd5] text-white shadow-blue-200';

        return 'bg-[#6499E9] hover:bg-[#5a8bd5] text-white';
    };

    // --- RENDER VIEWS ---

    // 1. LANDING PAGE
    if (view === AppView.LANDING) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl -top-24 -left-24 animate-pulse"></div>
                <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl -bottom-24 -right-24 animate-pulse"></div>

                <div className="max-w-5xl w-full z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
                            BSC Generator
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {/* Groups Card */}
                        <div
                            onClick={() => handlePortalSelect('YL_GROUPS')}
                            className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-[#6499E9] hover:border-[#6499E9] hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
                        >
                            <div className="bg-white/20 p-4 rounded-full mb-6 group-hover:bg-white/30 transition-colors">
                                <LayoutGrid className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">YL Groups</h2>
                        </div>

                        {/* Individual Card */}
                        <div
                            onClick={() => handlePortalSelect('YL_INDIVIDUAL')}
                            className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:bg-[#A6F6FF] hover:border-[#9EDDFF] hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
                        >
                            <div className="bg-white/10 p-4 rounded-full mb-6 group-hover:bg-white/30 transition-colors">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">YL Individual</h2>
                        </div>

                        {/* Adults Card */}
                        <div
                            onClick={() => handlePortalSelect('ADULTS')}
                            className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:bg-purple-600 hover:border-purple-500 hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
                        >
                            <div className="bg-white/10 p-4 rounded-full mb-6 group-hover:bg-white/30 transition-colors">
                                <Briefcase className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Adults</h2>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => setView(AppView.ADMIN)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/5"
                        >
                            <LockKeyhole className="w-4 h-4" />
                            Yönetici Girişi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. PRINT LAYOUT
    if (view === AppView.PRINT && selectedProgram && quoteDetails) {
        const programForPrint = {
            ...selectedProgram,
            galleryImages: currentGalleryImages,
            bannerImage: programBanner,
            heroImage: heroImage
        };

        return (
            <PrintLayout
                program={programForPrint}
                quote={quoteDetails}
                onBack={handleBackToDetail}
                customLogo={customLogo}
                customBanner={customBanner}
                timetableImages={timetableImages}
                portalType={currentPortal}
                onUploadLogo={handleLogoUpload}
                onSaveLogoDefault={handleSaveLogoDefault}
            />
        );
    }

    // 3. ADMIN PANEL
    if (view === AppView.ADMIN) {
        return (
            <AdminPanel
                programs={programs}
                currentPortal={currentPortal}
                onSwitchPortal={setCurrentPortal}
                onSave={handleAdminSave}
                onDelete={handleAdminDelete}
                onClose={handleBackToLanding}
            />
        );
    }

    // 4. LIST & DETAIL (MAIN APP)

    // Helper component for Detail View
    const DetailFeatureBox = ({ icon: Icon, title, value, sub }: { icon: any, title: string, value: string, sub?: string }) => (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-[#6499E9] rounded-lg">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">{title}</h4>
                <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
                {sub && <p className="text-sm text-slate-400 mt-1">{sub}</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2 cursor-pointer group" onClick={handleBackToList}>
                            {customLogo ? (
                                <img src={customLogo} alt="Logo" className="h-10 w-auto object-contain" />
                            ) : (
                                <>
                                    <div className="bg-[#6499E9] p-2 rounded-lg group-hover:bg-[#5a8bd5] transition-colors">
                                        <GraduationCap className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-xl text-slate-800 leading-none">BSC Generator</span>
                                        <span className="text-xs text-[#6499E9] font-medium tracking-wider">
                                            {currentPortal.replace('YL_', 'YL ').replace('_', ' ')}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackToLanding}
                                className="text-xs font-bold text-slate-500 hover:text-[#6499E9] px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 border border-slate-200 hover:bg-blue-50"
                            >
                                <ChevronLeft className="w-3 h-3" />
                                Ana Menü
                            </button>

                            {view === AppView.DETAIL && (
                                <button onClick={handleBackToList} className="text-sm font-medium text-slate-500 hover:text-[#6499E9] flex items-center gap-1">
                                    Tüm Programlar
                                </button>
                            )}

                            {view === AppView.DETAIL && selectedProgram && (
                                <button
                                    onClick={handleNewQuote}
                                    className="text-xs font-bold text-[#6499E9] bg-blue-50 hover:bg-[#6499E9] hover:text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 border border-blue-100"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Yeni Fiyatlandırma
                                </button>
                            )}

                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 text-slate-400 hover:text-[#6499E9] hover:bg-blue-50 rounded-full transition-all"
                                title="Ayarlar & Logo"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-0 relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-[#6499E9]" />
                                Kurumsal Kimlik Yönetimi
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <div className="p-6 space-y-8 overflow-y-auto">
                            {/* Logo Upload */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700">Kurumsal Logo</label>
                                    {customLogo && (
                                        <button onClick={() => setCustomLogo(null)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Kaldır
                                        </button>
                                    )}
                                </div>

                                <div className="w-full h-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group hover:border-[#6499E9] transition-colors">
                                    {customLogo ? (
                                        <div className="relative w-full h-full p-2 flex items-center justify-center">
                                            <img src={customLogo} alt="Logo" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400">
                                            <ImageIcon className="w-8 h-8 mb-1" />
                                            <span className="text-xs">Görsel Yok</span>
                                        </div>
                                    )}

                                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                        <div className="bg-white/90 text-slate-700 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2">
                                            <Upload className="w-3 h-3" /> {customLogo ? 'Değiştir' : 'Yükle'}
                                        </div>
                                    </label>
                                </div>
                                <p className="text-xs text-slate-400">PDF çıktılarının sol üst köşesinde görünecek logo.</p>
                            </div>

                            {/* Banner Upload */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-slate-700">PDF Banner Görseli (Varsayılan)</label>
                                    {customBanner && (
                                        <button onClick={() => setCustomBanner(null)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Kaldır
                                        </button>
                                    )}
                                </div>

                                <div className="w-full h-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group hover:border-[#6499E9] transition-colors">
                                    {customBanner ? (
                                        <img src={customBanner} alt="Banner" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400">
                                            <ImageIcon className="w-8 h-8 mb-1" />
                                            <span className="text-xs">Görsel Yok (Varsayılan şerit kullanılır)</span>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                                        <div className="bg-white/90 text-slate-700 px-3 py-1.5 rounded-full shadow-sm text-xs font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-2">
                                            <Upload className="w-3 h-3" /> {customBanner ? 'Değiştir' : 'Yükle'}
                                        </div>
                                    </label>
                                </div>
                                <p className="text-xs text-slate-400">PDF'in üst kısmı için (Önerilen: 2000x300px), Max 2MB</p>
                            </div>

                            {/* Database Controls */}
                            <div className="space-y-3 border-t border-dashed border-slate-200 pt-3">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Database className="w-4 h-4 text-purple-600" /> Veri Tabanı İşlemleri
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleSeedDatabase}
                                        disabled={isLoading}
                                        className="w-full bg-purple-50 text-purple-700 px-3 py-2 rounded-lg font-bold hover:bg-purple-100 flex items-center justify-center gap-2 text-xs border border-purple-200"
                                    >
                                        {isLoading ? '...' : 'Başlangıç Verilerini Yükle'}
                                    </button>
                                    <button
                                        onClick={handleResetAndRestore}
                                        disabled={isLoading}
                                        className="w-full bg-red-50 text-red-700 px-3 py-2 rounded-lg font-bold hover:bg-red-100 flex items-center justify-center gap-2 text-xs border border-red-200"
                                    >
                                        {isLoading ? '...' : 'Tümünü Sıfırla & Geri Yükle'}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400">Veri tabanı sorunlarında bu butonları kullanarak verileri düzeltebilirsiniz.</p>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-5 border-t border-slate-100 bg-gray-50 flex flex-col gap-3">
                            <button
                                onClick={handleSaveDefaults}
                                className="w-full bg-[#6499E9] text-white px-4 py-3 rounded-lg font-bold hover:bg-[#5a8bd5] flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all"
                            >
                                <Save className="w-4 h-4" />
                                Varsayılan Olarak Kaydet & Kapat
                            </button>

                            <div className="flex justify-between items-center mt-1">
                                <button
                                    onClick={handleClearDefaults}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded"
                                >
                                    <RotateCcw className="w-3 h-3" /> Varsayılanları Temizle
                                </button>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1"
                                >
                                    Değişiklikleri Kaydetmeden Çık
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow w-full">

                {view === AppView.LIST && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6499E9]"></div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-12 text-center max-w-3xl mx-auto">
                                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                                        {currentPortal === 'YL_GROUPS' ? 'Yaz Okulu Programları' : currentPortal === 'YL_INDIVIDUAL' ? 'Bireysel Dil Kursları' : 'Yetişkin Eğitimleri'}
                                    </h1>
                                    <p className="text-lg text-slate-600 leading-relaxed">
                                        İstediğiniz programı seçin ve saniyeler içinde kişiselleştirilmiş teklifinizi oluşturun.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {programs.map(program => (
                                        <ProgramCard key={program.id} program={program} onSelect={handleProgramSelect} />
                                    ))}
                                </div>
                                {programs.length === 0 && (
                                    <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-slate-100">
                                        <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-slate-700">Veri Bulunamadı</h3>
                                        <p className="text-slate-500 mt-2 mb-6">Bu portal için henüz program eklenmemiş veya veri tabanı boş.</p>
                                        <button onClick={handleSeedDatabase} className="bg-[#6499E9] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#5a8bd5]">
                                            Örnek Verileri Yükle
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {view === AppView.DETAIL && selectedProgram && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Hero Section */}
                        <div className="relative h-[40vh] min-h-[350px] w-full bg-slate-900 group">
                            <img
                                src={heroImage}
                                alt={selectedProgram.name}
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>

                            {/* Hero Edit Button - Top Right */}
                            <div className="absolute top-24 right-4 z-30 flex flex-col gap-2 items-end">
                                <label className="cursor-pointer bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all flex items-center justify-center border border-white/30 shadow-lg group-hover:scale-110" title="Kapak görselini değiştir">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
                                    <Camera className="w-6 h-6" />
                                </label>
                                {/* Show button if there is a pending change OR if we just saved successfully (to show 'Saved!') */}
                                {(heroImage !== selectedProgram.heroImage || saveStatus === 'success') && (
                                    <button
                                        onClick={handleSaveProgramDefaults}
                                        disabled={saveStatus === 'saving'}
                                        className={`text-xs font-bold px-4 py-2 rounded-full shadow-lg transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-right-4 ${getSaveButtonClass('purple')}`}
                                    >
                                        {saveStatus === 'saving' && 'Kaydediliyor...'}
                                        {saveStatus === 'success' && <><Check className="w-3 h-3" /> Kaydedildi!</>}
                                        {saveStatus === 'idle' && <><Save className="w-3 h-3" /> Varsayılan Olarak Kaydet</>}
                                    </button>
                                )}
                            </div>

                            <div className="absolute inset-0 flex flex-col justify-end pb-10 px-4">
                                <div className="max-w-7xl mx-auto w-full">
                                    <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest mb-3">
                                        <MapPin className="w-5 h-5" />
                                        {selectedProgram.city}, {selectedProgram.country}
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-lg tracking-tight">
                                        {selectedProgram.name}
                                    </h1>
                                    <div className="flex flex-wrap gap-6 text-white/90 text-lg font-medium">
                                        <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                            <Calendar className="w-5 h-5 text-blue-400" /> {selectedProgram.dates.replace(/\s*\/\s*/g, ', ')}
                                        </span>
                                        <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                            <Users className="w-5 h-5 text-orange-400" /> {selectedProgram.ageRange}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-10">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                                {/* Left Column (Main) */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DetailFeatureBox icon={Clock} title="Süre" value={selectedProgram.duration} sub="Haftalık seçenekler" />
                                        <DetailFeatureBox icon={Home} title="Konaklama" value={selectedProgram.accommodationType} sub={selectedProgram.accommodationDetails} />
                                    </div>

                                    {/* Included Services */}
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                                        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                            <span className="bg-[#6499E9] text-white p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                            Dahil Hizmetler
                                        </h3>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            {selectedProgram.includedServices.map((service, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-slate-700 font-medium group">
                                                    <div className="w-2 h-2 bg-[#9EDDFF] rounded-full mt-2 group-hover:bg-[#6499E9] transition-colors shrink-0"></div>
                                                    <span>{formatText(service)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* NEW: Young Learners Will Block */}
                                    {selectedProgram.youngLearnersGoals && selectedProgram.youngLearnersGoals.length > 0 && (
                                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                                            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                                <span className="bg-[#A6F6FF] text-[#6499E9] p-1 rounded-full"><Star className="w-4 h-4" /></span>
                                                Kazanımlar
                                            </h3>
                                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                {selectedProgram.youngLearnersGoals.map((goal, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-slate-700 font-medium group">
                                                        <div className="w-2 h-2 bg-[#A6F6FF] rounded-full mt-2 group-hover:bg-[#6499E9] transition-colors shrink-0"></div>
                                                        <span>{formatText(goal)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Gallery with Drag and Drop */}
                                    <div>
                                        <div className="flex justify-between items-end mb-6">
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-800">Galeri</h3>
                                                <span className="text-sm text-slate-500">PDF çıktısına eklenecek görseller</span>
                                            </div>
                                            <button
                                                onClick={handleSaveProgramDefaults}
                                                disabled={saveStatus === 'saving'}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${getSaveButtonClass('slate')}`}
                                                title="Bu görselleri bu program için varsayılan olarak kaydet"
                                            >
                                                {saveStatus === 'saving' && '...'}
                                                {saveStatus === 'success' && <><Check className="w-3.5 h-3.5" /> Kaydedildi!</>}
                                                {saveStatus === 'idle' && <><Save className="w-3.5 h-3.5" /> Varsayılan Olarak Kaydet</>}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {/* Existing Images */}
                                            {currentGalleryImages.map((img, idx) => (
                                                <div key={idx} className="rounded-xl overflow-hidden shadow-md h-48 md:h-40 group relative">
                                                    <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeGalleryImage(idx)}
                                                        className="absolute top-2 right-2 bg-white/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                                        title="Görseli Kaldır"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Drag & Drop Zone */}
                                            <div
                                                className={`rounded-xl border-2 border-dashed h-48 md:h-40 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${isDraggingGallery ? 'border-[#6499E9] bg-[#F0F9FF]' : 'border-slate-300 bg-slate-50 hover:border-[#6499E9] hover:bg-slate-100'}`}
                                                onDragOver={(e) => { e.preventDefault(); setIsDraggingGallery(true); }}
                                                onDragLeave={() => setIsDraggingGallery(false)}
                                                onDrop={handleGalleryDrop}
                                            >
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={handleGalleryFileInput}
                                                />
                                                <div className="pointer-events-none flex flex-col items-center p-4">
                                                    <div className={`p-3 rounded-full mb-2 ${isDraggingGallery ? 'bg-[#A6F6FF] text-[#6499E9]' : 'bg-slate-200 text-slate-400 group-hover:bg-[#A6F6FF] group-hover:text-[#6499E9]'}`}>
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <p className="font-bold text-slate-600 text-sm">Görsel Ekle</p>
                                                    <p className="text-xs text-slate-400 mt-1">Sürükle bırak veya seç</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timetable Upload Section - Updated Colors */}
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                                <span className="bg-[#6499E9] text-white p-1 rounded-full"><CalendarDays className="w-4 h-4" /></span>
                                                Örnek Program Çizelgesi
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                {timetableImages.length > 0 && (
                                                    <span className="text-sm text-slate-500">{timetableImages.length} / 5 Görsel</span>
                                                )}
                                                <button
                                                    onClick={handleSaveProgramDefaults}
                                                    disabled={saveStatus === 'saving'}
                                                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${getSaveButtonClass('orange')}`}
                                                    title="Bu çizelgeyi bu program için varsayılan olarak kaydet"
                                                >
                                                    {saveStatus === 'saving' && '...'}
                                                    {saveStatus === 'success' && <><Check className="w-3.5 h-3.5" /> Kaydedildi!</>}
                                                    {saveStatus === 'idle' && <><Save className="w-3.5 h-3.5" /> Varsayılan Olarak Kaydet</>}
                                                </button>
                                            </div>
                                        </div>

                                        {timetableImages.length < 5 ? (
                                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 group hover:border-[#6499E9] transition-colors relative mb-6">
                                                <CalendarDays className="w-10 h-10 text-slate-300 mb-2 group-hover:text-[#6499E9] transition-colors" />
                                                <h4 className="font-bold text-slate-700 text-sm mb-1">Görsel Yükle (Timetable)</h4>
                                                <p className="text-xs text-slate-500 mb-3">En fazla 5 adet görsel yükleyebilirsiniz.</p>
                                                <label className="absolute inset-0 cursor-pointer">
                                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleTimetableUpload} />
                                                </label>
                                                <button className="bg-[#6499E9] text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm">Dosya Seç</button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg text-sm mb-6 border border-yellow-200 text-center">
                                                Maksimum 5 görsel sınırına ulaştınız.
                                            </div>
                                        )}

                                        {timetableImages.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {timetableImages.map((img, idx) => (
                                                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 shadow-sm relative group bg-white">
                                                        <img src={img} alt={`Timetable ${idx + 1}`} className="w-full h-auto" />
                                                        <button
                                                            onClick={() => removeTimetableImage(idx)}
                                                            className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                                                            title="Sil"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column (Sidebar) */}
                                <div className="lg:col-span-1">
                                    <div className="sticky top-24 space-y-6">

                                        {/* Quote Form Component */}
                                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden">
                                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                <h3 className="font-bold text-slate-800">Teklif Oluştur</h3>
                                            </div>
                                            <QuoteForm
                                                program={selectedProgram}
                                                onGenerate={handleGenerateQuote}
                                                onCancel={() => { }}
                                                portalType={currentPortal}
                                                initialData={quoteDetails}
                                            />
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;