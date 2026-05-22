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

const getSingleIssue = ()=>{

}

export const issuesController = {
    postIssues,
    getAllIssues,
    getSingleIssue
}