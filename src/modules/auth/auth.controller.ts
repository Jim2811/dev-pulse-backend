import type { Request, Response } from "express"
import sendResponse from "../../utility/sendResponse"
import { authService } from "./auth.service"

const signUp = async (req: Request, res: Response) => {
    try {
        const result = await authService.createUserIntoDB(req.body)
        sendResponse(res, {
            statusCode: 201,
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

const login = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, user } = await authService.loginUser(req.body);

    res.cookie("refreshToken", refreshToken, {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: {
        token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      },
    });
  } catch (error) {
    const err = error as Error;
    sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Login failed",
      error: err.message,
    });
  }
};

const refreshToken = async (req: Request, res: Response)=>{
    
    try {
        const result = await authService.generateRefreshToken(req.cookies.refreshToken)
        sendResponse(res, {
            statusCode:201,
            success: true,
            message: "Access Token Generated",
            data: result
        })
    }
    catch (error: any) {
        console.log(error.message)
        sendResponse(res, {
            statusCode:500,
            success: false,
            message: "Access Token Generated",
            data: error.message
        })
    }
}
export const authController = {
    signUp,
    login,
    refreshToken
}