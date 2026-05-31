import mongoose from 'mongoose';

const jobEmbeddingSchema = new mongoose.Schema({
    jobId:     { type: mongoose.Types.ObjectId, ref: 'Job', required: true, unique: true },
    embedding: { type: [Number], required: true }
}, { timestamps: true });

export default mongoose.model('JobEmbedding', jobEmbeddingSchema, 'jobEmbeddings');
