import mongoose from "mongoose";
const jobSchema = new mongoose.Schema({
    company: {
        type: 'String',
        required: [true, 'Company name is required'],
    },
    position: {
        type: 'String',
        required: [true, 'Job position is required'],
        maxlength: 100,
    },
    status: {
        type: 'String',
        //required:[true, 'Company name is required'],
        enum: ['Pending', 'Reject', 'Interview'],
        default: 'Pending'
    },
    workType: {
        type: 'String',
        //required:[true, 'Company name is required'],
        enum: ['Full-Time', 'Part-Time', 'Internship', 'Contract'],
        default: 'Full-Time'
    },
    workLocation: {
        type: 'String',
        default: 'Andhra Pradesh',
        required: [true, 'workLocation is required'],
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });
export default mongoose.model('Job', jobSchema)