import express from 'express';
import userAuth from '../middelwares/authmware.js';
import { JobStatController, createJobController, getAllJobsController, updateJobController, deleteJobController, getLocationsController, chatController, getJobByIdController } from '../controllers/jobsController.js';
import { applyController, getAppliedController, getMyJobsController, statusController, messageApplicantController } from '../controllers/applyController.js';
const router = express.Router()
router.post('/create-job', userAuth, createJobController)
router.post('/apply', userAuth, applyController)
router.put('/changeapply/:id', userAuth, statusController)
router.get('/get-jobs', userAuth, getAllJobsController)
router.get('/get-my-jobs', userAuth, getMyJobsController)
router.get('/get-Wmy-jobs', userAuth, getAppliedController)
router.patch('/update-job/:id', userAuth, updateJobController)
router.delete('/delete-job/:id', userAuth, deleteJobController)
router.get('/job-stats', userAuth, JobStatController)
router.get('/locations', userAuth, getLocationsController)
router.get('/get-job/:id', userAuth, getJobByIdController)
router.post('/message-applicant', userAuth, messageApplicantController)
router.post('/chat', userAuth, chatController)
export default router