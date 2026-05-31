import 'dotenv/config';
import mongoose from 'mongoose';
import jobModels from '../models/jobModels.js';

await mongoose.connect(process.env.MONGO_URL);

const cities = [
    'Hyderabad', 'Bangalore', 'Mumbai', 'Chennai', 'Delhi', 'Pune',
    'Kolkata', 'Noida', 'Gurgaon', 'Ahmedabad', 'Jaipur', 'Coimbatore',
    'Kochi', 'Chandigarh', 'Indore', 'Nagpur', 'Visakhapatnam', 'Bhopal',
    'Lucknow', 'Surat'
];

const companies = [
    'Infosys', 'TCS', 'Wipro', 'HCL Technologies', 'Tech Mahindra',
    'Zoho Corporation', 'Freshworks', 'Flipkart', 'Swiggy', 'Zomato',
    'Razorpay', 'PhonePe', 'Paytm', 'Groww', 'Meesho',
    'PolicyBazaar', 'Nykaa', 'Delhivery', 'Urban Company', 'Cars24',
    'MakeMyTrip', 'OYO Rooms', 'Byju\'s', 'Unacademy', 'upGrad',
    'ShareChat', 'Dunzo', 'Rapido', 'ClearTax', 'Khatabook',
    'Ola Cabs', 'Juspay', 'Vedantu', 'Lenskart', 'CarDekho',
    'Practo', 'HealthKart', '1mg', 'Cult.fit', 'DailyHunt',
    'InMobi', 'Mu Sigma', 'Druva', 'Darwinbox', 'Postman',
    'Browserstack', 'Browserstack', 'Chargebee', 'Kissflow', 'Springworks'
];

const salaryByType = {
    'Full-Time':  { min: [6, 8, 10, 12, 15], max: [15, 20, 25, 30, 40] },
    'Part-Time':  { min: [3, 4, 5],           max: [8,  10, 12] },
    'Internship': { min: [2, 3, 4],           max: [5,  6,  8] },
    'Contract':   { min: [8, 10, 12],         max: [20, 25, 35] },
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const jobs = await jobModels.find({});
console.log(`Updating ${jobs.length} jobs with Indian data...`);

for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const company = companies[i % companies.length];
    const city = cities[i % cities.length];
    const ranges = salaryByType[job.workType] || salaryByType['Full-Time'];
    const salaryMin = rand(ranges.min);
    const salaryMax = rand(ranges.max.filter(m => m > salaryMin));

    await jobModels.updateOne({ _id: job._id }, {
        company,
        workLocation: city,
        salaryMin,
        salaryMax: salaryMax || salaryMin + 5,
        embedding: [],  // clear so re-embed picks them up
    });
    console.log(`✓ ${job.position} → ${company}, ${city}, ₹${salaryMin}–${salaryMax || salaryMin + 5} LPA`);
}

console.log('\nDone. Now run: node scripts/generateEmbeddings.js');
await mongoose.disconnect();
