import type { Request, Response } from "express"
import sendResponse from "../../utility/sendResponse"
import { authService } from "./auth.service"

const signUp = async (req: Request, res:Response) => {
    try {
        const result = await authService.createUserIntoDB(req.body)
        sendResponse(res, {
            statusCode:201,
            success: true,
            message: "Registration successfull",
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
                "message": err.message,
                "error": err,
            })
            console.log(err)
    }
}

const login = async (req:Request, res: Response)=>{
    try{
        const result = await authService.loginUser(req.body)
        
        sendResponse(res,
            {   
                "statusCode": 200,
                "success": false,
                "message": "Login Success",
                'data': result
            })
    }
    catch(error){
        const err = error as Error
        sendResponse(res,
            {   
                "statusCode": 404,
                "success": false,
                "message": err.message,
                "error": err,
            })
    }
}

export const authController = {
    signUp,
    login
}