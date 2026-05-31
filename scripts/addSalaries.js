import mongoose from 'mongoose';
import jobModels from '../models/jobModels.js';

const MONGO_URL = 'mongodb+srv://bhuvanchatti579:akshitha135@cluster0.vobxskm.mongodb.net/jobportal';

const salaryByType = {
    'Internship': { min: 1, max: 6 },
    'Part-Time':  { min: 3, max: 12 },
    'Full-Time':  { min: 6, max: 35 },
    'Contract':   { min: 8, max: 40 },
};

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

await mongoose.connect(MONGO_URL);

const jobs = await jobModels.find({ $or: [{ salaryMin: null }, { salaryMin: { $exists: false } }] });
console.log(`Found ${jobs.length} jobs without salary`);

for (const job of jobs) {
    const range = salaryByType[job.workType] || salaryByType['Full-Time'];
    const min = rand(range.min, range.max - 2);
    const max = rand(min + 2, range.max);
    await jobModels.updateOne({ _id: job._id }, { $set: { salaryMin: min, salaryMax: max } });
}

console.log(`Updated ${jobs.length} jobs with salary ranges`);
await mongoose.disconnect();
