import { supabase } from '../utils/database.js';
import base62 from '../utils/base62.js';
import logger from '../utils/logger.js'

class URLShortenerModel{
  static async createTable(){
    logger.info('Table creation is managed by Supabase migrations.');
  }

  //!why should I insert first , then update??
  static async create(originalUrl,expiresAt=null){
    try {
      const { data, error } = await supabase
        .from('urls')
        .insert([{ original_url: originalUrl, expires_at: expiresAt, short_id: 'temp' }])
        .select();

      if (error) {
        throw error;
      }

      const urlRecord = data[0];
      const shortId = base62.encode(urlRecord.id);

      const { data: updatedData, error: updateError } = await supabase
        .from('urls')
        .update({ short_id: shortId })
        .eq('id', urlRecord.id)
        .select();

      if (updateError) {
        throw updateError;
      }

      return updatedData[0];
    } catch (error) {
      logger.error('Error Creating Short URL:', error);
      throw error;
    }
  }
  static async getAnalytics(shortId) {
    try {
      const { data, error } = await supabase
        .from('urls')
        .select('clicks, last_accessed, created_at, expires_at')
        .eq('short_id', shortId);

      if (error) {
        throw error;
      }

      return data[0] || null;
    } catch (error) {
      logger.error('Error Getting Analytics:', error);
      throw error;
    }
  }
  static async findByShortId(shortId) {
    try {
      const { data, error } = await supabase
        .from('urls')
        .select('*')
        .eq('short_id', shortId);

      if (error) {
        throw error;
      }

      return data[0] || null;
    } catch (error) {
      logger.error('Error Finding URL by Short Id:', error);
      throw error;
    }
  }
  //!there's no need to return data
static async incrementClicks(shortId) {
  try {
    const { error } = await supabase
      .rpc('increment_clicks', { short_id_param: shortId }); // Use short_id_param here

    if (error) {
      throw error;
    }

    logger.info(`Clicks incremented for shortId: ${shortId}`);
  } catch (error) {
    logger.error('Error Incrementing Clicks:', error);
    throw error;
  }
}
}

export default URLShortenerModel;