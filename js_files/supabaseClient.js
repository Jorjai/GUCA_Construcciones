// js_files/supabaseClient.js

const SUPABASE_URL = "https://hhoizmkovcckuprzblpm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhob2l6bWtvdmNja3VwcnpibHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzM1NDEsImV4cCI6MjA5NTUwOTU0MX0.an9HfJDKFi7Rm-aDSw91QmyC0lxU_fC50plkTpLJz9Q";

const GucaSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);