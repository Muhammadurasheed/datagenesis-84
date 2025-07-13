import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
function validateSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.');
  }
  
  // Check if they're still placeholder values
  if (supabaseUrl.includes('your_supabase') || supabaseUrl === 'your_supabase_project_url') {
    throw new Error(`
🔧 Supabase Setup Required!

Please configure your Supabase credentials in .env file:

1. Go to https://supabase.com and create a project
2. Get your Project URL and Anon Key from Settings > API
3. Update your .env file:
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

Current URL: ${supabaseUrl}
    `);
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please check your .env file.`);
  }
  
  if (supabaseAnonKey.includes('your_supabase') || supabaseAnonKey === 'your_supabase_anon_key') {
    throw new Error(`
🔧 Supabase API Key Required!

Please set your Supabase Anon Key in .env file:
VITE_SUPABASE_ANON_KEY=your-actual-anon-key

Get it from: https://supabase.com → Your Project → Settings → API
    `);
  }
}

// Validate before creating client
validateSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  domain: string;
  data_type: 'tabular' | 'timeseries' | 'text' | 'image';
  status: 'draft' | 'generating' | 'completed' | 'failed';
  config: any;
  created_at: string;
  updated_at: string;
}

export interface Dataset {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  file_size: number;
  rows_count: number;
  columns_count: number;
  schema: any;
  quality_score: number;
  privacy_score: number;
  bias_score: number;
  created_at: string;
}

export interface GenerationJob {
  id: string;
  project_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  config: any;
  result_dataset_id?: string;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}