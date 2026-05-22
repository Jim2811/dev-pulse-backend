import { pool } from "../../db";
import type { IIssue } from "./issues.interface";


const createIssueIntoDB = async (payload: IIssue) => {
    const { title, description, status, type, reporter_id } = payload;
    const user = await pool.query(
        `
            SELECT * FROM users WHERE id=$1
        `
        , [reporter_id])
    if (user.rows.length === 0) {
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

const getAllIssuesFromDB = async (sort: string, type?: string, status?: string) => {
    let query = `SELECT * FROM issues`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (type) {
        params.push(type);
        conditions.push(`type = $${params.length}`);
    }
    if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }
    if (sort === "oldest") {
        query += ` ORDER BY created_at ASC`;
    } else {
        query += ` ORDER BY created_at DESC`;
    }

    const result = await pool.query(query, params);

    const issues = [];
    for (const issue of result.rows) {
        const reporterData = await pool.query(
            `SELECT id, name, role FROM users WHERE id=$1`,
            [issue.reporter_id]
        );

        const { reporter_id, ...issueWithoutReporterId } = issue;

        issues.push({
            ...issueWithoutReporterId,
            reporter: reporterData.rows[0],
        });
    }

    return issues;
};


const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `SELECT * FROM issues WHERE id=$1`,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const issue = result.rows[0];

  const reporterData = await pool.query(
    `SELECT id, name, role FROM users WHERE id=$1`,
    [issue.reporter_id]
  );

  const { reporter_id, ...issueWithoutReporterId } = issue;

  return {
    ...issueWithoutReporterId,
    reporter: reporterData.rows[0],
  };
};


export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB
};
