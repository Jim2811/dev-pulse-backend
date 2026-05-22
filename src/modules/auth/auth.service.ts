import { pool } from "../../db";
const createUserIntoDB = async (payload:any)=>{
    const { name, email, password, role } = payload
    const result = await pool.query(
      `
      INSERT INTO users(name, email, password, role)
      VALUES($1, $2, $3,  COALESCE($4, 'contributor'))
      RETURNING *
      `,
      [name, email, password, role]
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
    if (!user || password != user.password) {
        throw new Error("Invalid Credentials")
    }
    return user
}
export const authService = {
    createUserIntoDB,
    loginUser
}