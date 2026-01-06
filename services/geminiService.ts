import { GoogleGenAI } from "@google/genai";
import { Program, QuoteDetails } from '../types';

const getAIClient = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_GOOGLE_API_KEY or VITE_API_KEY in your .env file.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEmailDraft = async (program: Program, quote: QuoteDetails): Promise<string> => {
  try {
    const ai = getAIClient();
    const model = "gemini-2.5-flash"; // Or use a model constant
    
    const prompt = `
      Sen profesyonel bir yurtdışı eğitim danışmanısın.
      Aşağıdaki bilgilere dayanarak acente ve danışman adına veliye veya kurumsal müşteriye gönderilmek üzere nazik, profesyonel ve ikna edici bir e-posta taslağı yaz (Türkçe).
      E-posta, programın avantajlarını vurgulamalıdır.

      Gönderen Bilgileri:
      - Acente: ${quote.agencyName}
      - İletişim: ${quote.consultantName}

      Program Detayları:
      - İsim: ${program.name}
      - Konum: ${program.location}, ${program.city}, ${program.country}
      - Yaş Aralığı: ${program.ageRange}
      - Konaklama: ${program.accommodationType} - ${program.accommodationDetails}
      
      Teklif Detayları:
      - Öğrenci Sayısı: ${quote.studentCount}
      - Grup Lideri Sayısı: ${quote.groupLeaderCount}
      - Süre: ${quote.durationWeeks} Hafta
      - Öğrenci Başı Toplam Ücret: ${quote.pricePerStudent}
      - Ek Lider Ücreti: ${quote.extraLeaderPrice || 'Belirtilmemiş'}
      - Notlar: ${quote.notes}

      Lütfen sadece e-posta gövdesini oluştur, konu satırını da en başa ekle.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "E-posta oluşturulamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    if ((error as Error).message.includes("API Key is missing")) {
       return "API Anahtarı eksik olduğu için taslak oluşturulamadı. Lütfen .env dosyasını kontrol edin.";
    }
    return "Yapay zeka servisine şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyiniz.";
  }
};

export const getProgramHighlights = async (program: Program): Promise<string[]> => {
    try {
        const ai = getAIClient();
        const model = "gemini-2.5-flash";
        const prompt = `
          Aşağıdaki yaz okulu programı için 3 adet kısa, vurucu "Öne Çıkan Özellik" (bullet point) oluştur.
          Program: ${program.name} (${program.city}, ${program.country})
          Açıklama: ${program.description}
          Dahil Hizmetler: ${program.includedServices.join(', ')}
          
          Çıktı formatı JSON array olsun: ["Özellik 1", "Özellik 2", "Özellik 3"]
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating highlights:", error);
        return ["Harika Lokasyon", "Yoğun İngilizce Eğitimi", "Kültürel Aktiviteler"];
    }
}