import AnalyzeService from '../services/analyze.service.js';

class AnalyzeController {
  static async analyzeHeaders(req, res, next) {
    try {
      const { url } = req.query;
      const result = await AnalyzeService.analyzeHeaders({ url });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async analyzeUrl(req, res, next) {
    try {
      const { url, timeout } = req.query;
      const result = await AnalyzeService.analyzeUrl({ 
        url, 
        timeout: timeout ? parseInt(timeout) : 5000 
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default AnalyzeController;