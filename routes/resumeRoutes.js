import express from 'express';
import multer from 'multer';
import userAuth from '../middelwares/authmware.js';
import { uploadResumeController, saveResumeDataController, getResumeDataController } from '../controllers/resumeController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload', userAuth, upload.single('resume'), uploadResumeController);
router.put('/save', userAuth, saveResumeDataController);
router.get('/get', userAuth, getResumeDataController);

export default router;
