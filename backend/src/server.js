import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRouter from './routes/userRouter.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors';
import friendRoute from './routes/friendRoute.js';
import messageRoute from './routes/messageRoute.js';
import conversationRoute from './routes/conversationRoute.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import {app, server} from './socket/index.js';
import { v2 as cloudinary } from 'cloudinary';


dotenv.config();
//const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CLIENT_URL, credentials: true})); // Enable CORS for the frontend URL 

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// swagger 
const swaggerDocument = JSON.parse(fs.readFileSync(new URL('./swagger.json', import.meta.url), 'utf8'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


//public routes
app.use('/api/auth', authRoute);
//private routes
app.use(protectedRoute); // Add this line to use the protectedRoute middleware
app.use('/api/users', userRouter);
app.use('/api/friends', friendRoute);
app.use('/api/messages', messageRoute); // Add this line to use the messageRoute
app.use("/api/conversations", conversationRoute); // Add this line to use the conversationRoute

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});

