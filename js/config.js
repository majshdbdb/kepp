// Supabase Configuration
const SUPABASE_URL = 'https://bksguejdlekzodfonqce.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc2d1ZWpkbGVrem9kZm9ucWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDQ5OTcsImV4cCI6MjA3NzEyMDk5N30.y2s2G1bM08wyVVDeVz35KWb5qtHIrml3QNFLnGmPQNY';

// Initialize Supabase
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase initialized successfully');
