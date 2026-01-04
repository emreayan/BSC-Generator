
import { supabase } from './supabaseClient';
import { Program, PortalType } from '../types';
import { INITIAL_PROGRAMS_YL_GROUPS, INITIAL_PROGRAMS_YL_INDIVIDUAL, INITIAL_PROGRAMS_ADULTS } from '../data';

// Database Row Mapping Helpers
const mapDbToProgram = (row: any): Program => ({
  id: row.id,
  name: row.name,
  location: row.location,
  city: row.city,
  country: row.country,
  ageRange: row.age_range,
  dates: row.dates,
  duration: row.duration,
  accommodationType: row.accommodation_type,
  accommodationDetails: row.accommodation_details,
  includedServices: row.included_services || [],
  youngLearnersGoals: row.young_learners_goals || [],
  description: row.description,
  heroImage: row.hero_image,
  bannerImage: row.banner_image,
  galleryImages: row.gallery_images || [],
  timetableImages: row.timetable_images || [],
  basePriceNote: row.base_price_note
});

const mapProgramToDb = (program: Program, portal: PortalType) => ({
  portal_type: portal,
  name: program.name,
  location: program.location,
  city: program.city,
  country: program.country,
  age_range: program.ageRange,
  dates: program.dates,
  duration: program.duration,
  accommodation_type: program.accommodationType,
  accommodation_details: program.accommodationDetails,
  description: program.description,
  hero_image: program.heroImage,
  banner_image: program.bannerImage,
  base_price_note: program.basePriceNote,
  included_services: program.includedServices,
  young_learners_goals: program.youngLearnersGoals,
  gallery_images: program.galleryImages,
  timetable_images: program.timetableImages
});

export const programService = {
  async fetchPrograms(portal: PortalType): Promise<Program[]> {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('portal_type', portal);

    if (error) {
      console.error('Error fetching programs from Supabase:', error.message);
      // Fallback to local initial data if DB fails
      if (portal === 'YL_GROUPS') return INITIAL_PROGRAMS_YL_GROUPS;
      if (portal === 'YL_INDIVIDUAL') return INITIAL_PROGRAMS_YL_INDIVIDUAL;
      if (portal === 'ADULTS') return INITIAL_PROGRAMS_ADULTS;
      return [];
    }

    if (!data || data.length === 0) {
      // If no data in DB, return empty array (restoreMissingPrograms will handle population)
      return [];
    }

    return data.map(mapDbToProgram);
  },

  async saveProgram(program: Program, portal: PortalType): Promise<Program | null> {
    const dbPayload = mapProgramToDb(program, portal);
    
    // Payload Size Check (approximate)
    const payloadString = JSON.stringify(dbPayload);
    const sizeInBytes = new Blob([payloadString]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 5) {
        alert(`UYARI: Veri paketi boyutu çok büyük (${sizeInMB.toFixed(2)} MB). Kaydetme işlemi başarısız olabilir. Lütfen daha az veya daha küçük görseller kullanın.`);
    }
    
    try {
        if (program.id && program.id.length > 20) {
          // Update existing UUID
          const { data, error } = await supabase
            .from('programs')
            .update(dbPayload)
            .eq('id', program.id)
            .select()
            .single();
            
          if (error) throw error;
          return mapDbToProgram(data);
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('programs')
            .insert(dbPayload)
            .select()
            .single();

          if (error) throw error;
          return mapDbToProgram(data);
        }
    } catch (error: any) {
        console.error('Error saving program to Supabase:', error);
        
        let errorMessage = 'Bilinmeyen bir hata oluştu.';
        if (error.code === '23505') {
             errorMessage = 'Benzersizlik kısıtlaması ihlali (Duplicate entry).';
        } else if (error.message && error.message.includes('payload')) {
             errorMessage = 'Veri boyutu çok büyük! Lütfen görselleri küçültün.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        alert(`Kaydetme Hatası: ${errorMessage}`);
        throw error;
    }
  },

  async deleteProgram(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting program:', error);
      return false;
    }
    return true;
  },

  async seedDatabase(portal: PortalType) {
    let dataToSeed: Program[] = [];
    if (portal === 'YL_GROUPS') dataToSeed = INITIAL_PROGRAMS_YL_GROUPS;
    else if (portal === 'YL_INDIVIDUAL') dataToSeed = INITIAL_PROGRAMS_YL_INDIVIDUAL;
    else if (portal === 'ADULTS') dataToSeed = INITIAL_PROGRAMS_ADULTS;

    for (const prog of dataToSeed) {
        await this.saveProgram({...prog, id: ''}, portal); 
    }
  },

  async restoreMissingPrograms(portal: PortalType) {
    // 1. Get current programs from DB
    const { data: currentDbPrograms, error } = await supabase
      .from('programs')
      .select('name')
      .eq('portal_type', portal);

    if (error) {
        console.error("Error checking existing programs", error);
        return;
    }

    const currentNames = currentDbPrograms.map(p => p.name);

    // 2. Identify initial data for this portal
    let initialData: Program[] = [];
    if (portal === 'YL_GROUPS') initialData = INITIAL_PROGRAMS_YL_GROUPS;
    else if (portal === 'YL_INDIVIDUAL') initialData = INITIAL_PROGRAMS_YL_INDIVIDUAL;
    else if (portal === 'ADULTS') initialData = INITIAL_PROGRAMS_ADULTS;

    // 3. Find missing programs
    const missingPrograms = initialData.filter(initProg => !currentNames.includes(initProg.name));

    // 4. Insert missing programs
    if (missingPrograms.length > 0) {
        console.log(`Restoring ${missingPrograms.length} missing programs for ${portal}...`);
        for (const prog of missingPrograms) {
            // Save as new record (empty ID)
            await this.saveProgram({ ...prog, id: '' }, portal);
        }
        return true; // Indicates changes were made
    }
    return false; // No changes
  },

  async resetAndSeedDatabase(portal: PortalType) {
    const { error } = await supabase
        .from('programs')
        .delete()
        .eq('portal_type', portal);
    
    if (error) {
        console.error('Error deleting programs:', error);
        throw error;
    }
    
    await this.seedDatabase(portal);
  }
};
