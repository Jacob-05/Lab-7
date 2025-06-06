import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://ycvequsoqraotadikrqz.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdmVxdXNvcXJhb3RhZGlrcnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyMTY4MTksImV4cCI6MjA2NDc5MjgxOX0.y2cqNsMWqzOWgwqsUUt0cC9zqq7mY9Y7rTacZ6DikuI";


export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});