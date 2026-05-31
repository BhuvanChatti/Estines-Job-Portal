import jobModels from "../models/jobModels.js";
import ApplJobs from "../models/jobsApplied.js";
import mongoose from "mongoose";
import moment from "moment";
import Groq from "groq-sdk";
import { embedText, embedQuery, jobToText } from "../utils/embeddings.js";
import JobEmbedding from "../models/jobEmbeddingModel.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const createJobController = async (req, res, next) => {
    const { company, position, requirements } = req.body;
    if (!company || !position) {
        return next('Please provide all fields');
    }
    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
        return next('Please provide at least one requirement');
    }
    req.body.createdBy = req.body.user.userId;
    const job = await jobModels.create(req.body);
    // Generate embedding async — stored in separate collection
    embedText(jobToText(job)).then(embedding =>
        JobEmbedding.findOneAndUpdate({ jobId: job._id }, { jobId: job._id, embedding }, { upsert: true })
    ).catch(err => console.error('Embedding failed:', err.message));
    res.status(201).json({ job });
};
export const getAllJobsController = async (req, res) => {
    try {
        // const jobs = await jobModels.find({ createdBy: req.body.user.userId })
        const { status, workType, search, sort } = req.query
        const queryObject = {}
        if (status && status !== 'all') {
            queryObject.status = status;
        }
        if (workType && workType !== 'all') {
            queryObject.workType = workType;
        }
        const { location, salaryMin, salaryMax } = req.query;
        if (location && location.trim()) {
            const locs = location.split(',').map(l => l.trim()).filter(Boolean);
            queryObject.workLocation = locs.length === 1
                ? { $regex: locs[0], $options: 'i' }
                : { $in: locs };
        }
        if (salaryMin) queryObject.salaryMin = { $gte: Number(salaryMin) };
        if (salaryMax) queryObject.salaryMax = { $lte: Number(salaryMax) };
        if (search) {
            const regex = { $regex: search, $options: 'i' };
            queryObject.$or = [{ position: regex }, { company: regex }];
        }
        let queryResult = jobModels.find(queryObject);
        if (sort === 'latest') {
            queryResult = queryResult.sort('-createdAt')
        }
        if (sort === 'oldest') {
            queryResult = queryResult.sort('createdAt')
        }
        if (sort === 'a-z') {
            queryResult = queryResult.sort('position')
        }
        if (sort === 'z-a') {
            queryResult = queryResult.sort('-position')
        }
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const skip = (page - 1) * limit
        queryResult = queryResult.skip(skip).limit(limit);
        const totalJobs = await jobModels.countDocuments(queryObject);
        const numOfPage = Math.ceil(totalJobs / limit);
        const jobs = await queryResult;
        res.status(200).json({
            totalJobs,
            jobs,
            numOfPage
        })
    }
    catch (error) {
        console.error("getAllJobsController Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const updateJobController = async (req, res, next) => {
    const { id } = req.params
    const { company, position } = req.body
    if (!company || !position) {
        return next("Please Provide Required Fields");
    }
    const job = await jobModels.findOne({ _id: id });
    if (!job) {
        return next(`No jobs Found With This Id: ${id}`);
    }
    if (req.body.user.userId !== job.createdBy.toString()) {
        return next("You are not authorized to update this job");
    }
    const updateJob = await jobModels.findOneAndUpdate({ _id: id }, req.body, {
        new: true,
        runValidators: true
    })
    res.status(200).json({ updateJob })
};
export const deleteJobController = async (req, res, next) => {
    const { id } = req.params;
    const job = await jobModels.findOne({ _id: id });
    if (!job) {
        next(`No jobs Found With This Id: ${id}`)
    }
    if (req.body.user.userId !== job.createdBy.toString()) {
        return next("You are not authorized to update this job");
    }
    await job.deleteOne();
    res.status(200).json({ message: "Sucess, Job deleted" });
};
export const JobStatController = async (req, res) => {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.body.user.userId);

    const totalJobs = await jobModels.countDocuments({ createdBy: userId });

    const statusAgg = await ApplJobs.aggregate([
        { $match: { createdBy: userId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statsMap = statusAgg.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
    }, {});
    const defaultStats = {
        Pending: statsMap.Pending || 0,
        Reject: statsMap.Reject || 0,
        Interview: statsMap.Interview || 0,
        Selected: statsMap.Selected || 0,
    };

    let monthlyApplication = await ApplJobs.aggregate([
        { $match: { createdBy: userId } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 }
            }
        },
    ]);
    monthlyApplication = monthlyApplication.map(item => {
        const { _id: { year, month }, count } = item;
        const date = moment().month(month - 1).year(year).format('MMM y');
        return { date, count };
    }).reverse();

    res.status(200).json({ totalJobs, defaultStats, monthlyApplication });
};

export const getJobByIdController = async (req, res) => {
    try {
        const job = await jobModels.findById(req.params.id).populate('createdBy', 'name lastName email');
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.status(200).json({ job });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getLocationsController = async (_req, res) => {
    try {
        const locations = await jobModels.distinct('workLocation');
        res.status(200).json({ locations: locations.filter(Boolean).sort() });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const cosineSimilarity = (a, b) => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot   += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const NAV_CONTEXT = `
Site pages:
- /all-jobs → Browse and filter all job listings
- /dashboard → Your stats, application counts, monthly chart
- /resume → Upload resume PDF, AI extracts your info, edit manually
- /post-job → Post a new job (Recruiters only)
- /applied → View and manage applicants (Recruiters only)
- /user-profile → Edit your profile details
- /change-password → Change your password
- /profile → View your profile
- /contact → Contact support
`;

export const chatController = async (req, res) => {
    try {
        const { messages, resumeData } = req.body;

        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

        // Extract structured job search intent from full conversation
        const intentResponse = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `Extract the job search intent from this conversation into one plain sentence. Include: role/skills, preferred location, salary range, job type, and any exclusions. Example: "Full-stack developer roles near Hyderabad or Chennai, 10-20 LPA, full-time, not in Vizag". If no clear job intent yet, return: "general job search India".`
                },
                ...messages
            ],
            temperature: 0,
            max_tokens: 80,
        });
        const intentSummary = intentResponse.choices[0].message.content.trim();
        const ragQuery = intentSummary;

        // Fetch locations early — needed for proximity and exclusion logic
        const allLocations = await jobModels.distinct('workLocation');

        // Extract "not in X" exclusions from intent summary (clean, distilled)
        const CITY_ALIASES = { vizag: 'visakhapatnam', blr: 'bangalore', hyd: 'hyderabad', mum: 'mumbai', del: 'delhi' };
        const exclusionMatch = intentSummary.match(/(?:not\s+in|not|outside|exclude|remove|except)\s+([a-zA-Z]+)/gi) || [];
        const excludedLocations = exclusionMatch
            .map(m => { const raw = m.replace(/(?:not\s+in|not|outside|exclude|remove|except)\s+/i, '').trim().toLowerCase(); return CITY_ALIASES[raw] || raw; })
            .filter(Boolean);

        // Proximity map for "near X" queries
        const NEARBY = {
            'visakhapatnam': ['Hyderabad', 'Chennai', 'Kolkata'],
            'vizag':         ['Hyderabad', 'Chennai', 'Kolkata'],
            'hyderabad':     ['Bangalore', 'Chennai', 'Pune'],
            'bangalore':     ['Hyderabad', 'Chennai', 'Pune'],
            'mumbai':        ['Pune', 'Surat', 'Ahmedabad'],
            'delhi':         ['Noida', 'Gurgaon', 'Chandigarh'],
            'chennai':       ['Bangalore', 'Coimbatore', 'Hyderabad'],
            'pune':          ['Mumbai', 'Bangalore', 'Nagpur'],
            'kolkata':       ['Bhopal', 'Lucknow', 'Nagpur'],
        };
        // Proximity from intent summary — already distilled from full conversation
        const nearMatch = intentSummary.match(/(?:near|close to|around|nearby|outside)\s+([a-zA-Z]+)/i);
        const nearCityRaw = nearMatch?.[1]?.toLowerCase();
        const nearCity = nearCityRaw ? (CITY_ALIASES[nearCityRaw] || nearCityRaw) : null;
        const nearbyOverride = nearCity && NEARBY[nearCity]
            ? NEARBY[nearCity].filter(c => allLocations.includes(c))
            : null;

        // Detect job search intent — skip RAG for greetings/nav/general
        const jobKeywords = /job|work|role|position|salary|lpa|hire|hiring|engineer|developer|designer|manager|analyst|intern|fresher|entry.level|fulltime|full.time|part.time|contract|location|city|bangalore|hyderabad|mumbai|delhi|pune|chennai|noida|remote|skills|experience|career|opening|vacancy|apply|filter|show me|find me|search|near|close to|vizag|visakhapatnam/i;
        const isJobQuery = jobKeywords.test(lastUserMsg);

        if (!isJobQuery) {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: `You are a friendly assistant for Estines Jobs — an Indian job portal. Reply naturally and helpfully. Do NOT mention jobs unless the user asks. Navigation info: ${NAV_CONTEXT.trim()}` },
                    ...messages
                ],
                temperature: 0.5,
            });
            return res.status(200).json({
                reply: completion.choices[0].message.content.trim(),
                filters: { search: '', workType: 'all', locations: [], salaryMin: 0, salaryMax: 50 }
            });
        }

        const queryEmbedding = await embedQuery(ragQuery);

        // Fetch all embeddings from separate collection
        const allEmbeddings = await JobEmbedding.find({});
        const jobIds = allEmbeddings.map(e => e.jobId);
        const jobDocs = await jobModels.find({ _id: { $in: jobIds } });
        const jobMap = Object.fromEntries(jobDocs.map(j => [j._id.toString(), j]));
        const allJobs = allEmbeddings.map(e => ({ ...jobMap[e.jobId.toString()]?.toObject(), embedding: e.embedding })).filter(j => j._id);

        // --- Hard filter: salary range ---
        const salaryMatch = lastUserMsg.match(/(\d+)\s*[-–to]+\s*(\d+)\s*lpa/i);
        let candidates = allJobs;
        let salaryFiltered = false;
        if (salaryMatch) {
            const lo = parseInt(salaryMatch[1]);
            const hi = parseInt(salaryMatch[2]);
            const filtered = allJobs.filter(j =>
                (j.salaryMin == null || j.salaryMin >= lo - 3) &&
                (j.salaryMax == null || j.salaryMax <= hi + 3)
            );
            if (filtered.length) { candidates = filtered; salaryFiltered = true; }
        }

        // --- Hard filter: location ---
        const mentionedLoc = allLocations.find(loc =>
            lastUserMsg.toLowerCase().includes(loc.toLowerCase())
        );
        let locationFiltered = false;
        if (mentionedLoc) {
            const filtered = candidates.filter(j =>
                j.workLocation.toLowerCase() === mentionedLoc.toLowerCase()
            );
            if (filtered.length) { candidates = filtered; locationFiltered = true; }
        }

        // --- Vector search within filtered candidates ---
        const ranked = candidates
            .map(job => ({ job, score: cosineSimilarity(queryEmbedding, job.embedding) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(({ job }) => ({
                position:  job.position,
                company:   job.company,
                location:  job.workLocation,
                type:      job.workType,
                salary:    `₹${job.salaryMin || '?'}–${job.salaryMax || '?'} LPA`,
                salaryMin: job.salaryMin || 0,
                salaryMax: job.salaryMax || 50,
                requirements: job.requirements,
            }));

        const matchNote = mentionedLoc && !locationFiltered
            ? `Note: No jobs found in "${mentionedLoc}" — showing closest alternatives from other locations.`
            : salaryFiltered && !ranked.length
            ? 'Note: No jobs found matching the requested salary range.'
            : '';

        // ── FILTERS derived from RAG results — model has no say ──
        const autoFilters = { search: '', workType: 'all', locations: [], salaryMin: 0, salaryMax: 50 };
        // If proximity override exists and no ranked results, apply it directly
        if (!ranked.length && nearbyOverride?.length) {
            autoFilters.locations = nearbyOverride;
        }
        if (ranked.length) {
            const locs = [...new Set(ranked.map(j => j.location).filter(Boolean))];
            // Use user's requested salary range if specified, else derive from jobs
            if (salaryMatch) {
                autoFilters.salaryMin = parseInt(salaryMatch[1]);
                autoFilters.salaryMax = parseInt(salaryMatch[2]);
            } else {
                const mins = ranked.map(j => j.salaryMin).filter(n => n > 0);
                const maxs = ranked.map(j => j.salaryMax).filter(n => n > 0);
                if (mins.length) autoFilters.salaryMin = Math.min(...mins);
                if (maxs.length) autoFilters.salaryMax = Math.max(...maxs);
            }
            if (nearbyOverride) {
                // User said "near/outside X" — use proximity map
                autoFilters.locations = nearbyOverride
                    .filter(c => !excludedLocations.some(ex => c.toLowerCase().includes(ex)))
                    .slice(0, 3);
            } else if (mentionedLoc || excludedLocations.length > 0) {
                // User explicitly mentioned a location — filter by RAG results
                autoFilters.locations = locs
                    .filter(l => !excludedLocations.some(ex => l.toLowerCase().includes(ex)))
                    .slice(0, 3);
            }
            const types = [...new Set(ranked.map(j => j.type))];
            if (types.length === 1) autoFilters.workType = types[0];
        }

        // ── Model only writes the reply sentence ──
        const resumeCtx = resumeData?.skills?.length
            ? ` User skills: ${resumeData.skills.slice(0, 5).join(', ')}.`
            : '';
        const replySystem = `You are a concise job assistant for Estines Jobs (India-only portal).${resumeCtx}
${ranked.length
    ? `I found ${ranked.length} relevant job(s). Write ONE friendly sentence telling the user results are shown, without naming any company or job title.`
    : matchNote
    ? `No jobs matched. Write ONE sentence explaining: "${matchNote}" and suggest refining the search.`
    : `No jobs found. Write ONE sentence asking what role or city they are looking for.`
}
${NAV_CONTEXT.trim()}
Only if user explicitly wants a real human: +91 7386096329 | bhuvanchattiproject@gmail.com
Reply with plain text only — no JSON, no bullet points, no markdown.`;

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: replySystem }, ...messages],
            temperature: 0.3,
        });

        const reply = completion.choices[0].message.content.trim().split('\n')[0];
        res.status(200).json({ reply, filters: autoFilters });
    } catch (error) {
        console.error('chatController:', error.message);
        res.status(500).json({ reply: 'Sorry, I ran into an issue. Please try again.', filters: null });
    }
};