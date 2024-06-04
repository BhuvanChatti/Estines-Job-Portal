import express from 'express';
import userAuth from '../middelwares/authmware.js';
import { JobStatController, createJobController, getAllJobsController } from '../controllers/jobsController.js';
import { updateJobController, deleteJobController } from './../controllers/jobsController.js';
const router = express.Router()
router.post('/create-job', userAuth, createJobController)
router.get('/get-jobs', userAuth, getAllJobsController)
router.patch('/update-job/:id', userAuth, updateJobController)
router.delete('/delete-job/:id', userAuth, deleteJobController)
router.get('/job-stats', userAuth, JobStatController)
export default router