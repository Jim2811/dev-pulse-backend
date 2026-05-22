import { pool } from "../../db";
import type { IIssue } from "./issues.interface";


const createIssueIntoDB = async (payload: IIssue) => {
  const { title, description, status, type, reporter_id } = payload;
  const user = await pool.query(
        `
            SELECT * FROM users WHERE id=$1
        ` 
    , [reporter_id ])
    if(user.rows.length ===0){
        throw new Error("User not exist")
    }

  const result = await pool.query(
    `
    INSERT INTO issues(title, description, status, type, reporter_id)
    VALUES($1, $2, COALESCE($3, 'open'), $4, $5)
    RETURNING *
    `,
    [title, description, status, type, reporter_id]
  );

  return result.rows[0];
};

export const issueService = {
  createIssueIntoDB
};
