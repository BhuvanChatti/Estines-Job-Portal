import mongoose from 'mongoose';

const resumeDataSchema = new mongoose.Schema({
    name:     String,
    email:    String,
    phone:    String,
    location: String,
    summary:  String,
    skills:   [String],
    experience: [{ title: String, company: String, duration: String, description: String }],
    education:  [{ degree: String, institution: String, year: String }]
}, { _id: false });

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    resumeUrl:     { type: String, default: '' },
    draftData:     resumeDataSchema,
    publishedData: resumeDataSchema,
    status: {
        draft:     { type: Boolean, default: false },
        published: { type: Boolean, default: false }
    }
}, { timestamps: true });

export default mongoose.model('Resume', resumeSchema, 'resumes');
