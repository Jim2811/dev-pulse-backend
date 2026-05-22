import type { Request, Response } from "express"
import sendResponse from "../../utility/sendResponse"
import { authService } from "./auth.service"

const signUp = async (req: Request, res:Response) => {
    try {
        const result = await authService.createUserIntoDB(req.body)
        sendResponse(res, {
            statusCode:201,
            success: true,
            message: "created successfully",
            data: result.rows[0]
        })
        // console.log(result)
    }
    catch (error) {
        const err = error as Error
        sendResponse(res,
            {   
                "statusCode": 500,
                "success": false,
                "message": "Error description",
                "error": err.message,
            })
            console.log(err)
    }
}

export const authController = {
    signUp
}