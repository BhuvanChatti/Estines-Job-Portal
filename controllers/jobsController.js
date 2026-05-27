import jobModels from "../models/jobModels.js";
import ApplJobs from "../models/jobsApplied.js";
import mongoose from "mongoose";
import moment from "moment";
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
    res.status(201).json({ job });
};
export const getAllJobsController = async (req, res, next) => {
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
        if (search) {
            queryObject.position = { $regex: search, $options: 'i' };
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
    const userId = new mongoose.Types.ObjectId(req.body.user.userId);

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