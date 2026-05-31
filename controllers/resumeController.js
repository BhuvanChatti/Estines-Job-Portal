import { v2 as cloudinary } from 'cloudinary';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import Groq from 'groq-sdk';
import JWT from 'jsonwebtoken';
import ResumeModel from '../models/resumeModel.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const getUserId = (req) => req.user?.userId || req.body.user?.userId;

export const uploadResumeController = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const userId = getUserId(req);

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

        let draftData = {};
        try {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [{
                    role: 'user',
                    content: `Extract from this resume and return ONLY valid JSON with no explanation:\n{"name":"","email":"","phone":"","location":"","summary":"","skills":[],"experience":[{"title":"","company":"","duration":"","description":""}],"education":[{"degree":"","institution":"","year":""}]}\n\nResume:\n${text}`
                }],
                temperature: 0,
            });
            const raw = completion.choices[0].message.content.trim();
            const jsonStart = raw.indexOf('{');
            const jsonEnd = raw.lastIndexOf('}');
            draftData = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
            console.log('Parsed resume keys:', Object.keys(draftData));
        } catch (aiErr) {
            console.error('AI parsing failed:', aiErr.message);
        }

        const resume = await ResumeModel.findOneAndUpdate(
            { userId },
            {
                resumeUrl: uploadResult.secure_url,
                draftData,
                'status.draft': true,
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            resumeUrl: resume.resumeUrl,
            draftData: resume.draftData,
            publishedData: resume.publishedData || {},
            status: resume.status,
        });
    } catch (error) {
        console.error('uploadResumeController:', error.message);
        res.status(500).json({ message: 'Resume processing failed', error: error.message });
    }
};

export const saveDraftController = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { draftData, resumeUrl } = req.body;
        const update = { draftData, 'status.draft': true };
        if (resumeUrl !== undefined) update.resumeUrl = resumeUrl;
        const resume = await ResumeModel.findOneAndUpdate(
            { userId },
            update,
            { upsert: true, new: true }
        );
        res.status(200).json({ success: true, status: resume.status });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save draft', error: error.message });
    }
};

export const publishResumeController = async (req, res) => {
    try {
        const userId = getUserId(req);
        // Arena Pro pattern: published = draft (sync them)
        const resume = await ResumeModel.findOneAndUpdate(
            { userId },
            [{ $set: {
                publishedData:    '$draftData',
                'status.published': true,
                'status.draft':     false,
            }}],
            { new: true }
        );
        if (!resume) return res.status(404).json({ message: 'No resume found' });
        res.status(200).json({ success: true, status: resume.status });
    } catch (error) {
        res.status(500).json({ message: 'Failed to publish resume', error: error.message });
    }
};

export const revertResumeController = async (req, res) => {
    try {
        const userId = getUserId(req);
        // Arena Pro pattern: draft = published (revert draft back to last published)
        const resume = await ResumeModel.findOneAndUpdate(
            { userId },
            [{ $set: {
                draftData:    '$publishedData',
                'status.draft': false,
            }}],
            { new: true }
        );
        res.status(200).json({ success: true, draftData: resume?.draftData, status: resume?.status });
    } catch (error) {
        res.status(500).json({ message: 'Failed to revert', error: error.message });
    }
};

export const getResumeController = async (req, res) => {
    try {
        const userId = getUserId(req);
        const resume = await ResumeModel.findOne({ userId });
        res.status(200).json({
            success: true,
            resumeUrl:     resume?.resumeUrl     || '',
            draftData:     resume?.draftData     || {},
            publishedData: resume?.publishedData || {},
            status:        resume?.status        || { draft: false, published: false },
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch resume', error: error.message });
    }
};

export const viewResumeController = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (!userId) {
            const token = req.query.token || req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ message: 'Unauthorised' });
            const payload = JWT.verify(token, process.env.JWT_S);
            userId = payload.userId;
        }

        const resume = await ResumeModel.findOne({ userId }).populate('userId', 'name lastName');
        if (!resume?.resumeUrl) return res.status(404).json({ message: 'No resume found' });

        const response = await fetch(resume.resumeUrl);
        if (!response.ok) return res.status(502).json({ message: 'Failed to fetch resume' });

        const user = resume.userId;
        const name = `${user?.name || 'Resume'}${user?.lastName ? '_' + user.lastName : ''}_Resume.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${name}"`);
        response.body.pipe(res);
    } catch (error) {
        res.status(500).json({ message: 'Failed to serve resume', error: error.message });
    }
};
