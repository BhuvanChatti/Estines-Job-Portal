import mongoose from "mongoose";
const AppliedjobSchema = new mongoose.Schema({
    ApplicantID: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    JobId: {
        type: mongoose.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    status: {
        type: 'String',
        //required:[true, 'Company name is required'],
        enum: ['Pending', 'Reject', 'Interview','Selected'],
        default: 'Pending'
    }
}, { timestamps: true });
export default mongoose.model('ApplJob', AppliedjobSchema, 'AppliedJobs')