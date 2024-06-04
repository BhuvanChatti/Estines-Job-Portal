import express from 'express';
import { testPostController } from '../controllers/testControllers.js';
import userAuth from './../middelwares/authmware.js';
const router = express.Router();
router.post('/testpost', userAuth, testPostController);
export default router;