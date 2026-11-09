/**
 * Dolanesia - Supabase Cloud Configuration
 * Sinkronisasi Real-time PostgreSQL untuk Vercel & Mobile PWA
 */
const SUPABASE_CONFIG = {
  // Masukkan Project URL & Anon Key dari dashboard Supabase Anda (supabase.com)
  url: window.ENV_SUPABASE_URL || '',
  anonKey: window.ENV_SUPABASE_ANON_KEY || '',

  isConfigured: function() {
    return Boolean(this.url && !this.url.includes('your-project-id') && this.anonKey && !this.anonKey.includes('your-anon-key') && this.url.startsWith('https://'));
  }
};

window.SUPABASE_CONFIG = SUPABASE_CONFIG;
