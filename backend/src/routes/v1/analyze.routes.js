import express from 'express';
import AnalyzeController from '../../controllers/analyze.controller.js';
import { headersSchema, urlSchema } from '../../utils/analyzeValidation.js';
import { validateQuery } from '../../middleware/validation.middleware.js';

const router = express.Router();

router.get('/headers',
  validateQuery(headersSchema),
  AnalyzeController.analyzeHeaders
);

router.get('/url',
  validateQuery(urlSchema),
  AnalyzeController.analyzeUrl
);

export default router;



