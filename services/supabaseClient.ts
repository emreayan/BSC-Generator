import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// LÜTFEN AŞAĞIDAKİ ALANLARI KENDİ SUPABASE PROJE BİLGİLERİNİZLE GÜNCELLEYİN
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://sbcguecybdjgyhszmanr.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiY2d1ZWN5YmRqZ3loc3ptYW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjU0NjQsImV4cCI6MjA3OTk0MTQ2NH0.PVUShmxjJMFYOzsiJZux_uvLYnnCoFa0vGKteL1FfC0';

// ------------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
