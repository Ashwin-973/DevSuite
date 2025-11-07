import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  try {
    const { data, error } = await supabase.from('urls').select('*').limit(1);
    if (error) {
      throw error;
    }
    logger.info('Connected to Supabase database');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};


const query = async (table, action, params) => {
  try {
    let result;
    switch (action) {
      case 'select':
        result = await supabase.from(table).select(params.columns).match(params.filters);
        break;
      case 'insert':
        result = await supabase.from(table).insert(params.data);
        break;
      case 'update':
        result = await supabase.from(table).update(params.data).match(params.filters);
        break;
      case 'delete':
        result = await supabase.from(table).delete().match(params.filters);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    if (result.error) {
      throw result.error;
    }

    return result.data;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

export {
  connectDB,
  query,
  supabase,
};