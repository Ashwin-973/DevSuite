import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import routes from './routes/index.js'
import errorHandler from './middleware/errorHandler.middleware.js';
import requestLatencyMonitor from './middleware/latency.middleware.js'
import logger from './utils/logger.js'

const app=express()

app.use(requestLatencyMonitor);


//security middleware
app.use(helmet())
app.use(cors())

//rate-limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter)

//body parsing middleware
app.use(express.json({limit:'10mb'}))
app.use(express.urlencoded({extended:true}))

//request logger
app.use((req,res,next)=>
{
    logger.info(`${req.method} ${req.path} - ${req.ip}`)
    next()
})

//main entry point of api utility endpoints
app.get('/',(req,res)=>
{
    res.json({
        status:'OK',
        message:'Gentlemen...Welcome to Fight Club'
    })
})
app.use('/api',routes)

app.get('/health',(req,res)=>
{
    res.json({
        status:'OK',
        timestamp: new Date().toString()
    })
})

app.use(errorHandler)

//wildcard route handler
app.get('*any',(req,res)=>
{
    res.status(404).json({
        success:'false',
        message:'Cannot Find that URL!!',
        path:req.originalUrl
    })
})

export default app
