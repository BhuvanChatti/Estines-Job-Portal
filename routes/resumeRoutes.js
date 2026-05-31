import express from 'express';
import multer from 'multer';
import userAuth from '../middelwares/authmware.js';
import {
    uploadResumeController,
    saveDraftController,
    publishResumeController,
    revertResumeController,
    getResumeController,
    viewResumeController,
} from '../controllers/resumeController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload',  userAuth, upload.single('resume'), uploadResumeController);
router.put('/draft',    userAuth, saveDraftController);      // auto-save draft
router.put('/publish',  userAuth, publishResumeController);  // explicit save/publish
router.put('/revert',   userAuth, revertResumeController);   // revert draft → published
router.get('/get',      userAuth, getResumeController);
router.get('/view',     userAuth, viewResumeController);
router.get('/view/:userId', userAuth, viewResumeController);

export default router;
