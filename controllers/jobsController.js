import jobModels from "../models/jobModels.js"
import mongoose from "mongoose";
import moment from "moment";
export const createJobController = async (req, res, next) => {
    const { company, position } = req.body
    if (!company || !position) {
        next('Please provide all feilds')
    }
    req.body.createdBy = req.user.userId
    const job = await jobModels.create(req.body)
    res.status(201).json({ job })
};
export const getAllJobsController = async (req, res, next) => {
    // const jobs = await jobModels.find({ createdBy: req.user.userId })
    const { status, workType, search, sort } = req.query
    const queryObject = {
        createdBy: req.user.userId
    }
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
    const totalJobs = await jobModels.countDocuments(queryResult);
    const numOfPage = Math.ceil(totalJobs / limit);
    const jobs = await queryResult;
    res.status(200).json({
        totalJobs,
        jobs,
        numOfPage
    })
};
export const updateJobController = async (req, res, next) => {
    const { id } = req.params
    const { company, position } = req.body
    if (!company || !position) {
        next("Please Provide Required Feilds")
    }
    const job = await jobModels.findOne({ _id: id })
    if (!job) {
        next(`No jobs Found With This Id: ${id}`)
    }
    if (!req.user.userId === job.createdBy.toString()) {
        next("You are not authorized to update this job");
        return;
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
    if (!req.user.userId === job.createdBy.toString()) {
        next("You are not authorized to update this job");
        return;
    }
    await job.deleteOne();
    res.status(200).json({ message: "Sucess, Job deleted" });
};
export const JobStatController = async (req, res) => {
    const stats = await jobModels.aggregate([
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(req.user.userId),
            },
        },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            }
        },
    ]);
    const defaultStats = {
        Pending: stats.PeInding || 0,
        Reject: stats.Reject || 0,
        Interview: stats.Reject || 0
    };
    let monthlyApplication = await jobModels.aggregate([

        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(req.user.userId),
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
    ]);
    monthlyApplication = monthlyApplication.map(item => {
        const { _id: { year, month }, count } = item
        const date = moment().month(month - 1).year(year).format('MMM y')
        return { date, count }
    }).reverse();
    res.status(200).json({ totalJobs: stats.length, defaultStats, monthlyApplication });
};