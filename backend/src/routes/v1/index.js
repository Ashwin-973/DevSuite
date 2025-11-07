import express from 'express'
import urlShortenerRoutes from './urlShortener.routes.js'
import textTransformRoutes from './textTransform.routes.js'
import timeZoneRoutes from './timeZone.routes.js'
import cronRoutes from './cronGenerator.routes.js'
import analyzeRoutes from './analyze.routes.js';

const router=express.Router()

router.use('/url',urlShortenerRoutes)

router.use('/text',textTransformRoutes)

router.use('/time',timeZoneRoutes)

router.use('/cron', cronRoutes)

router.use('/analyze', analyzeRoutes);


export default router