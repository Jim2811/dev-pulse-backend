import { pool } from "../../db";
import bcrypt from "bcrypt"
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
    return user
}
export const authService = {
    createUserIntoDB,
    loginUser
}