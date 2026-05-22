import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config/config";
import { pool } from "../db";
export type UserRole = "contributor" | "maintainer";
const authMiddleware = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access! No token provided"
        });
      }

      const decode = jwt.verify(
        token,
        config.jwtSecret as string
      ) as JwtPayload;

      const userData = await pool.query(
        `SELECT * FROM users WHERE email=$1`,
        [decode.email]
      );

      if (userData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User Not Found!"
        });
      }

      const user = userData.rows[0];

      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized Access!"
        });
      }

      (req as any).user = user;

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
        error
      });
    }
  };
};

export default authMiddleware;
