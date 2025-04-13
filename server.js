import swaggerUi from 'swagger-ui-express';
import swaggerDoc from "swagger-jsdoc";
import express from 'express';
import "express-async-errors";
import dotenv from 'dotenv';
import colors from 'colors';
import cors from 'cors';
import morgan from 'morgan';
import testRoutes from './routes/testRoutes.js';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import authRoutes from './routes/authRouter.js';
import ermidlwr from './middelwares/errormware.js';
import jobsRoutes from './routes/jobsRoutes.js'
import userRoutes from './routes/userRoutes.js';
dotenv.config();

connectDB();

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: 'Job Portal Application',
            description: 'Node Expressjs Job Portal Application'
        },
        servers: [
            {
                url: "https://estines-job-portal.onrender.com"
            }
        ]
    },
    apis: ["./routes/*.js"],
}
const spec = swaggerDoc(options)
const app = express();
app.set('trust proxy', 1);

app.use(morgan('dev'));
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 8000;
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/job', jobsRoutes);
app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(spec));
app.use(ermidlwr)
app.listen(PORT, () => {
    console.log(`Node server running in ${process.env.DEV} Mode on port ${PORT}`.bgCyan.red);
})
