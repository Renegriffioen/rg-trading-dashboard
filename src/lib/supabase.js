// file: src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Optie A: via env vars (aanrader)
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// (Eventuele fallback — alleen voor lokaal testen; liever env gebruiken)
const SUPABASE_URL = url || "https://uogykzuwdqzifetiylqg.supabase.co";
const SUPABASE_ANON_KEY = anon || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZ3lrenV3ZHF6aWZldGl5bHFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTUyMjgsImV4cCI6MjA3NjAzMTIyOH0.MtRb7Q8pzepOnlrBLr8njSvIgg__JO9w-pKtPpvPncE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase;
