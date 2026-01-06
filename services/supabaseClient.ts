import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// LÜTFEN AŞAĞIDAKİ ALANLARI KENDİ SUPABASE PROJE BİLGİLERİNİZLE GÜNCELLEYİN
// ------------------------------------------------------------------

const SUPABASE_URL = 'https://erozsjsztxoxrzyvgopo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyb3pzanN6dHhveHJ6eXZnb3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Mzk0NzcsImV4cCI6MjA4MzIxNTQ3N30.rWC9Z_I-aBvQPeE9JWSkOJTVlIfuBMa93Vt0xUMtb5s';

// ------------------------------------------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
