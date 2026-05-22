import { pool } from "../../db";
import bcrypt from "bcrypt"
import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../../config/config";
import sendResponse from "../../utility/sendResponse";
const createUserIntoDB = async (payload:any)=>{
    const { name, email, password, role } = payload
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `
      INSERT INTO users(name, email, password, role)
      VALUES($1, $2, $3,  COALESCE($4, 'contributor'))
      RETURNING *
      `,
      [name, email, hashedPassword, role]
    )
    delete result.rows[0].password
    return result
}
const loginUser = async (payload: {email:string, password:string})=>{
    const {email, password} = payload
    const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `, [email])

    const user = userData.rows[0]
    const matchPassword = await bcrypt.compare(password, user.password)
    if (!user || !matchPassword) {
        throw new Error("Invalid Credentials")
    }
    const jwtPayload = {
        id: user.id,
        name:user.name,
        email:user.email,
        role: user.role
    }
    const accessToken = jwt.sign(jwtPayload, config.jwtSecret as string, {
        expiresIn:"1D"
    })
    const refreshToken = jwt.sign(jwtPayload, config.refreshSecret as string, {
        expiresIn:"15D"
    })
    return {accessToken, refreshToken}
}

const generateRefreshToken = async(token: string)=>{

      if (!token) {
       throw new Error("Unauthorized access")
      }

      const decode = jwt.verify(
        token,
        config.refreshSecret as string
      ) as JwtPayload

      const userData = await pool.query(
        `
        SELECT * FROM users WHERE email=$1
        `,
        [decode.email]
      )

      const user = userData.rows[0]

      if (userData.rows.length === 0) {
        throw new Error("User not found")
      }
      const jwtPayload = {
        id: user.id,
        name:user.name,
        email:user.email,
        role: user.role,
        isActive: user.isActive
    }
      const accessToken = jwt.sign(jwtPayload, config.jwtSecret as string, {
        expiresIn:"1D"
    })
    return {accessToken}
}
export const authService = {
    createUserIntoDB,
    loginUser,
    generateRefreshToken
}