import React, { useState, useEffect } from 'react';
import { Program, PortalType } from '../types';
import { compressImage } from '../services/imageUtils';
import { Save, X, Plus, Edit2, Trash2, Image as ImageIcon, CheckSquare, Lock, Upload, Loader, LayoutGrid, Check } from 'lucide-react';

interface AdminPanelProps {
  programs: Program[];
  currentPortal: PortalType;
  onSwitchPortal: (portal: PortalType) => void;
  onSave: (program: Program) => Promise<boolean>; // Updated to return Promise
  onDelete: (id: string) => void;
  onClose: () => void;
}

const emptyProgram: Program = {
  id: '',
  name: '',
  location: '',
  city: '',
  country: '',
  ageRange: '',
  dates: '',
  duration: '',
  accommodationType: 'Residence',
  accommodationDetails: '',
  includedServices: [],
  youngLearnersGoals: [],
  description: '',
  heroImage: '',
  bannerImage: '',
  galleryImages: [],
  timetableImages: [],
  basePriceNote: ''
};

const AdminPanel: React.FC<AdminPanelProps> = ({ programs, currentPortal, onSwitchPortal, onSave, onDelete, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  
  // Save Status State: 'idle' | 'saving' | 'success'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  
  const [servicesText, setServicesText] = useState('');
  const [goalsText, setGoalsText] = useState('');

  // Check for previous session auth
  useEffect(() => {
    const auth = sessionStorage.getItem('BSC_ADMIN_AUTH');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') { 
      setIsAuthenticated(true);
      sessionStorage.setItem('BSC_ADMIN_AUTH', 'true');
    } else {
      alert('Hatalı şifre!');
    }
  };

  const startEdit = (program: Program | null) => {
    if (program) {
      setEditingProgram({ ...program });
      setServicesText(program.includedServices.join('\n'));
      setGoalsText(program.youngLearnersGoals ? program.youngLearnersGoals.join('\n') : '');
    } else {
      setEditingProgram({ ...emptyProgram, id: Date.now().toString() });
      setServicesText('');
      setGoalsText('');
    }
    setSaveStatus('idle');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;

    // Removed validation checks as requested

    const finalProgram: Program = {
      ...editingProgram,
      includedServices: servicesText.split('\n').filter(s => s.trim() !== ''),
      youngLearnersGoals: goalsText.split('\n').filter(s => s.trim() !== ''),
    };

    setSaveStatus('saving');
    const success = await onSave(finalProgram);
    
    if (success) {
      setSaveStatus('success');
      
      // Keep "Saved" message for 1.5s before closing modal
      setTimeout(() => {
          setEditingProgram(null);
          setSaveStatus('idle');
      }, 1500);
    } else {
        setSaveStatus('idle');
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file, 1000); // Admin Hero - moderate compression
            setEditingProgram(prev => prev ? ({...prev, heroImage: compressed}) : null);
        } catch (e) {
            alert('Görsel işlenirken hata oluştu.');
        }
    }
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const compressed = await compressImage(file, 1200); // Admin Banner
            setEditingProgram(prev => prev ? ({...prev, bannerImage: compressed}) : null);
        } catch (e) {
            alert('Görsel işlenirken hata oluştu.');
        }
    }
  };

  const handleGalleryImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files) {
        const files = Array.from(e.target.files) as File[];
        
        for (const file of files) {
            try {
                const compressed = await compressImage(file, 800, 0.7); // Admin Gallery
                setEditingProgram(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        galleryImages: [...prev.galleryImages, compressed]
                    };
                });
            } catch (e) {
                console.error("Gallery upload error", e);
            }
        }
     }
  };

  const removeGalleryImage = (index: number) => {
     setEditingProgram(prev => {
        if (!prev) return null;
        const newImages = [...prev.galleryImages];
        newImages.splice(index, 1);
        return { ...prev, galleryImages: newImages };
     });
  };

  const inputClass = "w-full p-3 border border-blue-200 rounded-lg bg-blue-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide text-xs";

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Yönetici Girişi</h2>
            <p className="text-slate-500 mb-6 text-sm">Programları düzenlemek için şifre giriniz.</p>
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-slate-900"
                    placeholder="Şifre"
                    autoFocus
                />
                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                    Giriş Yap
                </button>
                <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
                    İptal
                </button>
            </form>
        </div>
      </div>
    );
  }

  if (editingProgram) {
    return (
        <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-2xl my-8 border border-slate-200 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {editingProgram.id && programs.find(p => p.id === editingProgram.id) ? 'Programı Düzenle' : 'Yeni Program Ekle'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Lütfen program detaylarını eksiksiz giriniz.</p>
                </div>
                <button onClick={() => setEditingProgram(null)} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 p-2 rounded-full">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-8">
                {/* Images Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Hero Image */}
                    <div>
                        <label className={labelClass}>Kapak Görseli (Hero Image)</label>
                        <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 bg-blue-50/50 flex flex-col gap-4 items-center text-center">
                            <div className="w-full h-32 bg-white rounded-lg border border-blue-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm">
                                {editingProgram.heroImage ? (
                                    <img src={editingProgram.heroImage} alt="Hero" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-blue-200" />
                                )}
                            </div>
                            <div className="w-full">
                                <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
                                    <Upload className="w-4 h-4" />
                                    {editingProgram.heroImage ? 'Değiştir' : 'Yükle'}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleHeroImageUpload}
                                    />
                                </label>
                                <p className="text-xs text-slate-400 mt-2">Önerilen: 1200x600px, Max 2MB</p>
                            </div>
                        </div>
                    </div>

                     {/* Banner Image */}
                    <div>
                        <label className={labelClass}>PDF Banner Görseli</label>
                        <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 bg-purple-50/50 flex flex-col gap-4 items-center text-center">
                            <div className="w-full h-32 bg-white rounded-lg border border-purple-100 overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm">
                                {editingProgram.bannerImage ? (
                                    <img src={editingProgram.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-purple-200" />
                                )}
                            </div>
                            <div className="w-full">
                                <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg cursor-pointer hover:bg-purple-700 transition-colors shadow-sm">
                                    <Upload className="w-4 h-4" />
                                    {editingProgram.bannerImage ? 'Değiştir' : 'Yükle'}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleBannerImageUpload}
                                    />
                                </label>
                                <p className="text-xs text-slate-400 mt-2">PDF'in üst kısmı için (Önerilen: 2000x300px), Max 2MB</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Program İsmi</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.name}
                            onChange={e => setEditingProgram({...editingProgram, name: e.target.value})}
                            placeholder="Örn: Bsc London Hampstead"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Konum / Okul</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.location}
                            onChange={e => setEditingProgram({...editingProgram, location: e.target.value})}
                            placeholder="Örn: King's College"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Şehir</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.city}
                            onChange={e => setEditingProgram({...editingProgram, city: e.target.value})}
                            placeholder="Örn: Londra"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Ülke</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.country}
                            onChange={e => setEditingProgram({...editingProgram, country: e.target.value})}
                            placeholder="Örn: İngiltere"
                        />
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>Yaş Aralığı</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.ageRange}
                            onChange={e => setEditingProgram({...editingProgram, ageRange: e.target.value})}
                            placeholder="Örn: 12-17 Yaş"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Tarihler</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.dates}
                            onChange={e => setEditingProgram({...editingProgram, dates: e.target.value})}
                            placeholder="Örn: 30 Haz - 10 Ağu"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Süre Aralığı</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.duration}
                            onChange={e => setEditingProgram({...editingProgram, duration: e.target.value})}
                            placeholder="Örn: 2-6 Hafta"
                        />
                    </div>
                </div>

                 {/* Accommodation & Price */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className={labelClass}>Konaklama Tipi</label>
                        <select 
                            className={inputClass}
                            value={editingProgram.accommodationType}
                            onChange={e => setEditingProgram({...editingProgram, accommodationType: e.target.value as any})}
                        >
                            <option value="Residence">Residence</option>
                            <option value="Aile Yanı">Aile Yanı</option>
                            <option value="Otel">Otel</option>
                            <option value="Kampüs">Kampüs</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Fiyat Notu</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.basePriceNote}
                            onChange={e => setEditingProgram({...editingProgram, basePriceNote: e.target.value})}
                            placeholder="Örn: £1250 / Kişi Başı"
                        />
                    </div>
                     <div className="md:col-span-2">
                        <label className={labelClass}>Konaklama Detayı</label>
                        <input 
                            type="text"
                            className={inputClass}
                            value={editingProgram.accommodationDetails}
                            onChange={e => setEditingProgram({...editingProgram, accommodationDetails: e.target.value})}
                            placeholder="Örn: Tek kişilik özel banyolu odalar"
                        />
                    </div>
                 </div>

                {/* Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Dahil Hizmetler (Her satıra bir tane - Markdown Destekli)</label>
                        <textarea 
                            className={`${inputClass} h-40 font-mono text-sm`}
                            value={servicesText}
                            onChange={e => setServicesText(e.target.value)}
                            placeholder="Haftada 20 **ders**&#10;Gezi programı&#10;Sertifika"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">**Kalın** ve *İtalik* yazı desteklenir.</p>
                    </div>
                     <div className="md:col-span-2">
                        <label className={labelClass}>Kazanımlar... (Her satıra bir tane - Markdown Destekli)</label>
                        <textarea 
                            className={`${inputClass} h-32 font-mono text-sm`}
                            value={goalsText}
                            onChange={e => setGoalsText(e.target.value)}
                            placeholder="**Özgüven** kazanmak&#10;*Kültürel* etkileşim&#10;Bağımsızlık"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">**Kalın** ve *İtalik* yazı desteklenir.</p>
                    </div>
                </div>

                {/* Gallery Image Upload */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                         <label className={labelClass}>Galeri Görselleri</label>
                         <span className="text-xs text-slate-500">{editingProgram.galleryImages.length} görsel eklendi</span>
                    </div>
                    
                    <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {/* Upload Button */}
                            <label className="aspect-square bg-white border-2 border-dashed border-blue-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-colors group">
                                <Plus className="w-8 h-8 text-blue-300 group-hover:text-blue-500 mb-1" />
                                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-600">Ekle</span>
                                <input 
                                    type="file" 
                                    multiple
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleGalleryImagesUpload}
                                />
                            </label>

                            {/* Images List */}
                            {editingProgram.galleryImages.map((img, idx) => (
                                <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-slate-200 relative group shadow-sm bg-white">
                                    <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeGalleryImage(idx)}
                                        className="absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
                                        title="Kaldır"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 border-t pt-8">
                    <button 
                        type="button" 
                        onClick={() => setEditingProgram(null)}
                        className="px-6 py-3 rounded-lg border border-gray-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors"
                    >
                        İptal
                    </button>
                    <button 
                        type="submit" 
                        disabled={saveStatus !== 'idle'}
                        className={`px-8 py-3 rounded-lg text-white font-bold flex items-center gap-2 shadow-lg transition-all hover:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed ${saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {saveStatus === 'saving' && <Loader className="w-5 h-5 animate-spin" />}
                        {saveStatus === 'success' && <Check className="w-5 h-5" />}
                        {!['saving', 'success'].includes(saveStatus) && <Save className="w-5 h-5" />}
                        
                        {saveStatus === 'saving' && 'Kaydediliyor...'}
                        {saveStatus === 'success' && 'Kaydedildi!'}
                        {saveStatus === 'idle' && 'Programı Kaydet'}
                    </button>
                </div>
            </form>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Yönetici Paneli</h1>
                <p className="text-slate-500 font-medium">Bölüm seçin ve programları düzenleyin.</p>
            </div>
            <div className="flex gap-3">
                 <button 
                    onClick={() => startEdit(null)}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" /> Yeni Program Ekle
                </button>
                <button 
                    onClick={onClose}
                    className="bg-white border border-gray-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 hover:text-slate-800 transition-colors"
                >
                    Çıkış Yap
                </button>
            </div>
        </div>

        {/* Portal Switching Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {[
                { id: 'YL_GROUPS', label: 'Young Learners Groups' },
                { id: 'YL_INDIVIDUAL', label: 'Young Learners Individual' },
                { id: 'ADULTS', label: 'Adults' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSwitchPortal(tab.id as PortalType)}
                    className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
                        currentPortal === tab.id 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Görsel</th>
                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Program İsmi</th>
                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Şehir / Ülke</th>
                            <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {programs.map((prog) => (
                            <tr key={prog.id} className="hover:bg-blue-50/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-sm group-hover:shadow-md transition-all">
                                         <img src={prog.heroImage} alt={prog.name} className="w-full h-full object-cover" />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{prog.name}</div>
                                    <div className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">{prog.ageRange}</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                    {prog.city}, {prog.country}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button 
                                        onClick={() => startEdit(prog)}
                                        className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                        title="Düzenle"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm(`${prog.name} silinecek. Emin misiniz?`)) onDelete(prog.id);
                                        }}
                                        className="inline-flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {programs.length === 0 && (
                <div className="p-16 text-center text-slate-400 flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium">Bu bölümde henüz hiç program yok.</p>
                    <p className="text-sm mt-2">"Yeni Program Ekle" butonunu kullanarak başlayın.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default AdminPanel;