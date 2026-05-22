import type { Request, Response } from "express"
import { issueService } from "./issues.service";
import sendResponse from "../../utility/sendResponse";

const postIssues = async (req: Request, res: Response) => {
    try {
        const reporter_id = (req as any).user.id;

        const issue = await issueService.createIssueIntoDB({...req.body, reporter_id});

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
export const issuesController = {
    postIssues
}