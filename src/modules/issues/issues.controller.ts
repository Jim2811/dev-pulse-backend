import type { Request, Response } from "express"
import { issueService } from "./issues.service";
import sendResponse from "../../utility/sendResponse";

const postIssues = async (req: Request, res: Response) => {
    try {
        const reporter_id = (req as any).user.id;

        const issue = await issueService.createIssueIntoDB({ ...req.body, reporter_id });

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Issue created successfully",
            data: issue
        });
    } catch (error) {
        const err = error as Error;
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Failed to create issue",
            error: err.message
        });
    }
};
const getAllIssues = async (req: Request, res: Response) => {
    try {
        const sort = req.query.sort as string || "newest";
        const type = req.query.type as string;
        const status = req.query.status as string;

        const issues = await issueService.getAllIssuesFromDB(sort, type, status);

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrieved successfully",
            data: issues,
        });
    } catch (error) {
        const err = error as Error;
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Failed to retrieve issues",
            error: err.message,
        });
    }
};

const getSingleIssue = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const issue = await issueService.getSingleIssueFromDB(id as string);

        if (!issue) {
            return sendResponse(res, {
                statusCode: 404,
                success: false,
                message: "Issue NOT found",
            });
        }

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue Found",
            data: issue,
        });
    } catch (error) {
        const err = error as Error;
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: "Failed to retrieve issue",
            error: err.message,
        });
    }
};

const updateIssue = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, type } = req.body;
        const user = (req as any).user;

        const updatedIssue = await issueService.updateIssueInDB(
            id as string,
            { title, description, type },
            user
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue updated successfully",
            data: updatedIssue,
        });
    } catch (error) {
        const err = error as Error;
        let statusCode = 500;

        if (err.message.includes("not found")) statusCode = 404;
        else if (err.message.includes("Forbidden")) statusCode = 403;
        else if (err.message.includes("Conflict")) statusCode = 409;

        sendResponse(res, {
            statusCode,
            success: false,
            message: "Failed to update issue",
            error: err.message,
        });
    }
};



export const issuesController = {
    postIssues,
    getAllIssues,
    getSingleIssue,
    updateIssue
}