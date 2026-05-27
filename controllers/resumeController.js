import { v2 as cloudinary } from 'cloudinary';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';
import userModels from '../models/userModels.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const uploadResumeController = async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const buffer = req.file.buffer;

        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'raw', folder: 'estines-resumes', format: 'pdf' },
                (err, result) => err ? reject(err) : resolve(result)
            );
            stream.end(buffer);
        });

        const parsed = await pdfParse(buffer);
        const text = parsed.text?.slice(0, 8000) || '';

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(
            `Extract the following information from this resume text and return ONLY valid JSON with no explanation:\n{"name":"","email":"","phone":"","location":"","summary":"","skills":[],"experience":[{"title":"","company":"","duration":"","description":""}],"education":[{"degree":"","institution":"","year":""}]}\n\nResume text:\n${text}`
        );

        let parsedResume = {};
        try {
            const raw = result.response.text().trim();
            const jsonStart = raw.indexOf('{');
            const jsonEnd = raw.lastIndexOf('}');
            parsedResume = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
        } catch (_) {
            parsedResume = {};
        }

        await userModels.findByIdAndUpdate(req.body.user.userId, {
            resumeUrl: uploadResult.secure_url,
            parsedResume,
        });

        res.status(200).json({ success: true, resumeUrl: uploadResult.secure_url, parsedResume });
    } catch (error) {
        console.error('uploadResumeController:', error.message);
        res.status(500).json({ message: 'Resume processing failed', error: error.message });
    }
};

export const saveResumeDataController = async (req, res, next) => {
    try {
        const { parsedResume } = req.body;
        await userModels.findByIdAndUpdate(req.body.user.userId, { parsedResume });
        res.status(200).json({ success: true, message: 'Resume data saved' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save resume data', error: error.message });
    }
};

export const getResumeDataController = async (req, res, next) => {
    try {
        const user = await userModels.findById(req.body.user.userId).select('resumeUrl parsedResume');
        res.status(200).json({ success: true, resumeUrl: user.resumeUrl, parsedResume: user.parsedResume });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch resume data', error: error.message });
    }
};
