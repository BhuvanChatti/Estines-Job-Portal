import 'dotenv/config';
import mongoose from 'mongoose';
import jobModels from '../models/jobModels.js';
import JobEmbedding from '../models/jobEmbeddingModel.js';
import { embedText, jobToText } from '../utils/embeddings.js';

await mongoose.connect(process.env.MONGO_URL);

const embedded = new Set((await JobEmbedding.find({}, 'jobId')).map(e => e.jobId.toString()));
const jobs = await jobModels.find({ _id: { $nin: [...embedded].map(id => new mongoose.Types.ObjectId(id)) } });
console.log(`Generating embeddings for ${jobs.length} jobs...`);

for (const job of jobs) {
    try {
        const embedding = await embedText(jobToText(job));
        await JobEmbedding.findOneAndUpdate(
            { jobId: job._id },
            { jobId: job._id, embedding },
            { upsert: true }
        );
        console.log(`✓ ${job.position} @ ${job.company}`);
    } catch (err) {
        console.error(`✗ ${job.position}: ${err.message}`);
    }
}

console.log('Done.');
await mongoose.disconnect();
