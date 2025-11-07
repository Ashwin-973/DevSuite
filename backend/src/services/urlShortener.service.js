import URLShortenerModel from "../models/urlShortener.model.js";
import { parseExpiryTime } from "../utils/timeParser.js";
import logger from "../utils/logger.js";

class URLShortenerService{
    static async shortenUrl(originalUrl,expiresIn){
        try{
            const expiresAt = parseExpiryTime(expiresIn);
            const urlRecord=await URLShortenerModel.create(originalUrl,expiresAt)

            logger.info(`URL shortened: ${originalUrl} -> ${urlRecord.short_id}`);

            return{
                shortId:urlRecord.short_id,
                originalUrl:urlRecord.original_url,
                shortUrl:`${process.env.BASE_URL || 'http://localhost:3000'}/${process.env.V1_URL_MOUNT}/${urlRecord.short_id}`,
                createdAt:urlRecord.created_at,
                expiresAt:urlRecord.expires_at
                
            }
        }
        catch(error){
            logger.error('Error in shortenUrl Service : ',error); //?why do we log in the service handler and not anywhere else?
            throw error;
        }
    }

    static async getAnalytics(shortId){
      try{
        const analytics=await URLShortenerModel.getAnalytics(shortId)

        if(!analytics){
          return {
            error:'URL Not Found',
            statusCode:404
          }
        }

        return{
          shortId,
          clicks:analytics.clicks,
          createdAt:analytics.created_at,
          lastAccessed:analytics.last_accessed,
          expiresAt:analytics.expires_at,
          isExpired:analytics.expires_at? new Date > new Date (analytics.expires_at) : false
        }

      }
      catch(error){
        logger.error("Error in getAnalytics service: ",error)
        throw error;
      }
    }

    static async getOriginalUrl(shortId){
      try{
        const urlRecord=await URLShortenerModel.findByShortId(shortId)

        if(!urlRecord){
          return {
            error:'URL Not Found',
            statusCode:404
          }
        }
        if(urlRecord.expires_at && new Date() > new Date(urlRecord.expires_at)){
          return{
            error:'URL Has Expired',
            statusCode:410
          }
        }

        await URLShortenerModel.incrementClicks(shortId);

        return{
          originalUrl:urlRecord.original_url,
          shortId:urlRecord.short_id
        }

      }
      catch(error){
        logger.error("Error in getOriginalUrl Service : ",error)
        throw error;
      }
    }
}

export default URLShortenerService