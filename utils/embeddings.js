import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

export const embedText = async (text) => {
    const response = await cohere.embed({
        texts: [text],
        model: 'embed-english-v3.0',
        inputType: 'search_document',
    });
    return response.embeddings[0];
};

export const embedQuery = async (text) => {
    const response = await cohere.embed({
        texts: [text],
        model: 'embed-english-v3.0',
        inputType: 'search_query',
    });
    return response.embeddings[0];
};

export const jobToText = (job) =>
    `${job.position} at ${job.company}. Location: ${job.workLocation}. Type: ${job.workType}. ` +
    `Salary: ${job.salaryMin || '?'}–${job.salaryMax || '?'} LPA. ` +
    `${job.description ? job.description + ' ' : ''}` +
    `Requirements: ${(job.requirements || []).join(', ')}`;
