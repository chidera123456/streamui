
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cekdenxorsyxgwlyoihz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNla2RlbnhvcnN5eGd3bHlvaWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTE1MTQsImV4cCI6MjA4MjI2NzUxNH0.MJSyCmG9w_IXV7Ox775IsH0bW1Gj8w80J0w1VwHQbHk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
