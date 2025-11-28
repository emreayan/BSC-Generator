
import React, { useState, useEffect } from 'react';
import { Program, AppView, QuoteDetails, PortalType } from './types';
import { INITIAL_PROGRAMS_YL_GROUPS, INITIAL_PROGRAMS_YL_INDIVIDUAL, INITIAL_PROGRAMS_ADULTS } from './data';
import ProgramCard from './components/ProgramCard';
import QuoteForm from './components/QuoteForm';
import PrintLayout from './components/PrintLayout';
import AdminPanel from './components/AdminPanel';
import { ChevronLeft, MapPin, Calendar, Clock, Users, Home, Check, GraduationCap, Settings, Image as ImageIcon, Upload, Save, Trash2, RotateCcw, CalendarDays, LockKeyhole, Plus, X, LayoutGrid, User, Briefcase, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [currentPortal, setCurrentPortal] = useState<PortalType>('YL_GROUPS');
  
  // Programs State
  const [programs, setPrograms] = useState<Program[]>([]);
  
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

  // Load defaults from local storage on mount
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('BSC_DEFAULT_LOGO');
      const savedBanner = localStorage.getItem('BSC_DEFAULT_BANNER');
      if (savedLogo) setCustomLogo(savedLogo);
      if (savedBanner) setCustomBanner(savedBanner);
    } catch (e) {
      console.error("Error loading defaults from local storage", e);
    }
  }, []);

  // Load programs whenever currentPortal changes
  useEffect(() => {
      loadProgramsForPortal(currentPortal);
  }, [currentPortal]);

  const loadProgramsForPortal = (portal: PortalType) => {
      let storageKey = '';
      let initialData: Program[] = [];

      switch(portal) {
          case 'YL_GROUPS':
              storageKey = 'BSC_DATA_GROUPS';
              initialData = INITIAL_PROGRAMS_YL_GROUPS;
              break;
          case 'YL_INDIVIDUAL':
              storageKey = 'BSC_DATA_INDIVIDUAL';
              initialData = INITIAL_PROGRAMS_YL_INDIVIDUAL;
              break;
          case 'ADULTS':
              storageKey = 'BSC_DATA_ADULTS';
              initialData = INITIAL_PROGRAMS_ADULTS;
              break;
      }

      try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
              setPrograms(JSON.parse(saved));
          } else {
              setPrograms(initialData);
          }
      } catch {
          setPrograms(initialData);
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
    setView(AppView.LIST);
    window.scrollTo(0, 0);
  };

  const handleBackToLanding = () => {
      setView(AppView.LANDING);
  };

  // --- Program Specific Default Saving ---
  const handleSaveProgramDefaults = () => {
      if (!selectedProgram) return;

      const updatedProgram: Program = {
          ...selectedProgram,
          galleryImages: currentGalleryImages,
          timetableImages: timetableImages,
          bannerImage: programBanner,
          heroImage: heroImage
      };

      const newPrograms = programs.map(p => p.id === updatedProgram.id ? updatedProgram : p);
      setPrograms(newPrograms);
      setSelectedProgram(updatedProgram);
      
      const storageKey = getStorageKey(currentPortal);
      localStorage.setItem(storageKey, JSON.stringify(newPrograms));
      alert(`${updatedProgram.name} için tüm görseller (Kapak, Galeri, Çizelge, Banner) varsayılan olarak kaydedildi.`);
  };

  // --- Admin Logic ---
  const getStorageKey = (portal: PortalType) => {
    switch(portal) {
        case 'YL_GROUPS': return 'BSC_DATA_GROUPS';
        case 'YL_INDIVIDUAL': return 'BSC_DATA_INDIVIDUAL';
        case 'ADULTS': return 'BSC_DATA_ADULTS';
        default: return 'BSC_DATA_GROUPS';
    }
  };

  const handleAdminSave = (savedProgram: Program) => {
    setPrograms(prev => {
        const exists = prev.find(p => p.id === savedProgram.id);
        let newPrograms;
        if (exists) {
            newPrograms = prev.map(p => p.id === savedProgram.id ? savedProgram : p);
        } else {
            newPrograms = [...prev, { ...savedProgram, id: Date.now().toString() }];
        }
        
        const storageKey = getStorageKey(currentPortal);
        localStorage.setItem(storageKey, JSON.stringify(newPrograms));
        return newPrograms;
    });
  };

  const handleAdminDelete = (id: string) => {
    setPrograms(prev => {
        const newPrograms = prev.filter(p => p.id !== id);
        const storageKey = getStorageKey(currentPortal);
        localStorage.setItem(storageKey, JSON.stringify(newPrograms));
        return newPrograms;
    });
  };
  // -------------------

  // --- File Upload Handlers ---
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        alert("Uyarı: Yüklediğiniz logo dosyası büyük (>2MB).");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
         alert("Uyarı: Yüklediğiniz banner dosyası büyük (>2MB).");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProgramBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
         alert("Uyarı: Yüklediğiniz banner dosyası büyük (>2MB).");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProgramBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
         alert("Uyarı: Yüklediğiniz görsel büyük (>2MB).");
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTimetableUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
        if (timetableImages.length + files.length > 5) {
            alert("En fazla 5 adet çizelge görseli yükleyebilirsiniz.");
            return;
        }

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTimetableImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
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
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentGalleryImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        }
    });
  };

  const removeGalleryImage = (indexToRemove: number) => {
      setCurrentGalleryImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };
  // --------------------------------

  const handleSaveDefaults = () => {
    try {
      if (customLogo) {
        localStorage.setItem('BSC_DEFAULT_LOGO', customLogo);
      } else {
        localStorage.removeItem('BSC_DEFAULT_LOGO');
      }

      if (customBanner) {
        localStorage.setItem('BSC_DEFAULT_BANNER', customBanner);
      } else {
        localStorage.removeItem('BSC_DEFAULT_BANNER');
      }
      alert("Ayarlar varsayılan olarak kaydedildi.");
      setShowSettings(false);
    } catch (error) {
      alert("Hata: Görseller çok büyük.");
    }
  };

  const handleClearDefaults = () => {
    if(window.confirm("Kayıtlı varsayılan görseller silinsin mi?")) {
        localStorage.removeItem('BSC_DEFAULT_LOGO');
        localStorage.removeItem('BSC_DEFAULT_BANNER');
        setCustomLogo(null);
        setCustomBanner(null);
        alert("Varsayılan ayarlar temizlendi.");
    }
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
                          BSC Education
                      </h1>
                      <p className="text-xl text-slate-400 font-light">
                          Geleceği Tasarlayan Eğitim Platformu
                      </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                      {/* Groups Card */}
                      <div 
                        onClick={() => handlePortalSelect('YL_GROUPS')}
                        className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-blue-600 hover:border-blue-500 hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
                      >
                          <div className="bg-white/20 p-4 rounded-full mb-6 group-hover:bg-white/30 transition-colors">
                              <LayoutGrid className="w-10 h-10 text-white" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">Young Learners Groups</h2>
                          <p className="text-white/60 text-sm group-hover:text-white/90">
                              Yaz okulları ve grup programları yönetimi
                          </p>
                      </div>

                      {/* Individual Card */}
                      <div 
                        onClick={() => handlePortalSelect('YL_INDIVIDUAL')}
                        className="bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:bg-emerald-600 hover:border-emerald-500 hover:scale-105 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center h-64 justify-center"
                      >
                           <div className="bg-white/10 p-4 rounded-full mb-6 group-hover:bg-white/30 transition-colors">
                              <User className="w-10 h-10 text-white" />
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">Young Learners Individual</h2>
                          <p className="text-white/60 text-sm group-hover:text-white/90">
                              Bireysel öğrenci programları ve kursları
                          </p>
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
                          <p className="text-white/60 text-sm group-hover:text-white/90">
                              Yetişkinler için dil ve mesleki eğitimler
                          </p>
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
      />
    );
  }

  // 3. ADMIN PANEL
  if (view === AppView.ADMIN) {
      return (
          <AdminPanel 
            programs={programs}
            currentPortal={currentPortal}
            onSwitchPortal={setCurrentPortal} // This updates state and triggers useEffect load
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
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
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
                  <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xl text-slate-800 leading-none">Bsc Education</span>
                    <span className="text-xs text-blue-600 font-medium tracking-wider">
                        {currentPortal.replace('YL_', 'YL ').replace('_', ' ')}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleBackToLanding}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 border border-slate-200 hover:bg-blue-50"
                >
                    <ChevronLeft className="w-3 h-3" />
                    Ana Menü
                </button>

                {view === AppView.DETAIL && (
                    <button onClick={handleBackToList} className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1">
                         Tüm Programlar
                    </button>
                )}

                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
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
                <Settings className="w-5 h-5 text-blue-600" />
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
                
                <div className="w-full h-24 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group hover:border-blue-400 transition-colors">
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

                <div className="w-full h-32 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group hover:border-blue-400 transition-colors">
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
                <p className="text-xs text-slate-400">PDF'in en üstünde sayfa genişliğinde yer alacak görsel. (Eğer programa özel banner yoksa bu kullanılır)</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-gray-50 flex flex-col gap-3">
                <button 
                    onClick={handleSaveDefaults}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all"
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
          </div>
        )}

        {view === AppView.DETAIL && selectedProgram && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[500px] w-full bg-slate-900 group">
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
                    {heroImage !== selectedProgram.heroImage && (
                         <button 
                            onClick={handleSaveProgramDefaults}
                            className="bg-purple-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-right-4"
                         >
                            <Save className="w-3 h-3" /> Varsayılan Olarak Kaydet
                         </button>
                    )}
               </div>

               <div className="absolute inset-0 flex flex-col justify-end pb-16 px-4">
                  <div className="max-w-7xl mx-auto w-full">
                      <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest mb-3">
                        <MapPin className="w-5 h-5" />
                        {selectedProgram.city}, {selectedProgram.country}
                      </div>
                      <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-lg tracking-tight">
                        {selectedProgram.name}
                      </h1>
                      <div className="flex flex-wrap gap-6 text-white/90 text-lg font-medium">
                          <span className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                              <Calendar className="w-5 h-5 text-blue-400" /> {selectedProgram.dates}
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

                        {/* Description */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h3 className="text-2xl font-bold text-slate-800 mb-4">Program Hakkında</h3>
                            <p className="text-slate-600 text-lg leading-relaxed">{selectedProgram.description}</p>
                        </div>

                        {/* Included Services */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                             <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                                 <span className="bg-indigo-600 text-white p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                 Dahil Hizmetler
                             </h3>
                             <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {selectedProgram.includedServices.map((service, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-slate-700 font-medium group">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 group-hover:bg-indigo-600 transition-colors"></div>
                                        {service}
                                    </li>
                                ))}
                             </ul>
                        </div>

                        {/* Gallery with Drag and Drop */}
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">Galeri</h3>
                                    <span className="text-sm text-slate-500">PDF çıktısına eklenecek görseller</span>
                                </div>
                                <button 
                                    onClick={handleSaveProgramDefaults}
                                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                    title="Bu görselleri bu program için varsayılan olarak kaydet"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Varsayılan Olarak Kaydet
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
                                    className={`rounded-xl border-2 border-dashed h-48 md:h-40 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${isDraggingGallery ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-slate-100'}`}
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
                                        <div className={`p-3 rounded-full mb-2 ${isDraggingGallery ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <p className="font-bold text-slate-600 text-sm">Görsel Ekle</p>
                                        <p className="text-xs text-slate-400 mt-1">Sürükle bırak veya seç</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timetable Upload Section */}
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    <span className="bg-emerald-600 text-white p-1 rounded-full"><CalendarDays className="w-4 h-4" /></span>
                                    Örnek Program Çizelgesi
                                </h3>
                                <div className="flex items-center gap-3">
                                    {timetableImages.length > 0 && (
                                        <span className="text-sm text-slate-500">{timetableImages.length} / 5 Görsel</span>
                                    )}
                                    <button 
                                        onClick={handleSaveProgramDefaults}
                                        className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                                        title="Bu çizelgeyi bu program için varsayılan olarak kaydet"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        Varsayılan Olarak Kaydet
                                    </button>
                                </div>
                            </div>

                            {timetableImages.length < 5 ? (
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 group hover:border-emerald-400 transition-colors relative mb-6">
                                    <CalendarDays className="w-10 h-10 text-slate-300 mb-2 group-hover:text-emerald-500 transition-colors" />
                                    <h4 className="font-bold text-slate-700 text-sm mb-1">Görsel Yükle (Timetable)</h4>
                                    <p className="text-xs text-slate-500 mb-3">En fazla 5 adet görsel yükleyebilirsiniz.</p>
                                    <label className="absolute inset-0 cursor-pointer">
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleTimetableUpload} />
                                    </label>
                                    <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm">Dosya Seç</button>
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
                                    onCancel={() => {}} 
                                    portalType={currentPortal}
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
