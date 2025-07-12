import ApplJobs from "../models/jobsApplied.js";
import Jobs from "../models/jobModels.js";

export const applyController = async (req, res, next) => {
    try {
        const J = await Jobs.findById(req.body.job);
        const C = J.createdBy;
        const Jid = J._id;
        const U = req.body.user.userId;
        const A = ApplJobs.create({ ApplicantID: U, createdBy: C, JobId: J });
        console.log("success:", A);
        res.status(201).send({ message: "Applied Successfully", Appliedas: A });
    }
    catch (error) {
        res.status(500).send({ errors: error });

    }
};

export const statusController = async (req, res, next) => {
    try {
        console.log(req.params.id);
        const J = await ApplJobs.findOne({_id:req.params.id});
        const S = req.body.status;
        console.log(J, S);
        if (!J) {
            return res.status(404).json({ message: "Job application not found" });
        }
        const N = await ApplJobs.updateOne({_id:req.params.id}, {$set:{status: S}});
        res.status(200).json({ message: "Status updated successfully", J });
    } catch (error) {
        res.status(500).json({ message: "Failed to update status", error });
    }
};

export const getMyJobsController = async (req, res, next) => {
    try {
        // const jobs = await jobModels.find({ createdBy: req.body.user.userId })
        const { status, workType, search, sort } = req.query
        const queryObject = {
            ApplicantID: req.body.user.userId
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
        // let temp = ApplJobs.find(queryObject).populate("JobId");
        // let queryResult = temp.JobId
        let queryResult = ApplJobs.find(queryObject).populate("JobId");
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
        const totalJobs = await ApplJobs.countDocuments(queryObject);
        const numOfPage = Math.ceil(totalJobs / limit);
        const jobs = await queryResult;
        res.status(200).json({
            totalJobs,
            jobs,
            numOfPage
        })
    }
    catch (error) {
        console.error("getMyJobsController Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getAppliedController = async (req, res, next) => {
    try {
        // const jobs = await jobModels.find({ createdBy: req.body.user.userId })
        const { status, workType, search, sort } = req.query
        console.log(req.body.user.userId);
        const queryObject = {
            createdBy: req.body.user.userId
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
        // let temp = ApplJobs.find(queryObject).populate("JobId");
        // let queryResult = temp.JobId
        let queryResult = ApplJobs.find(queryObject).populate("JobId").populate("ApplicantID");
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
        const totalJobs = await ApplJobs.countDocuments(queryObject);
        const numOfPage = Math.ceil(totalJobs / limit);
        const jobs = await queryResult;
        res.status(200).json({
            totalJobs,
            jobs,
            numOfPage
        })
    }
    catch (error) {
        console.error("getAppliedController Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};