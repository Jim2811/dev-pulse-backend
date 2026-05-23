// src/app.ts
import express from "express";
import cors from "cors";

// src/modules/auth/auth.routes.ts
import { Router } from "express";

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/db/index.ts
import { Pool } from "pg";

// src/config/config.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connectionString: process.env.DB_Connection_String,
  port: process.env.PORT,
  jwtSecret: process.env.jwtSecret,
  refreshSecret: process.env.refreshSecret
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connectionString
});
var initDB = async () => {
  try {
    await pool.query(
      `
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(150) UNIQUE NOT NULL,
            password text NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )`
    );
    console.log("DB Created successfully");
    await pool.query(
      `
            CREATE TABLE IF NOT EXISTS issues (
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT NOT NULL CHECK (char_length(description) >= 20),
            type VARCHAR(20) NOT NULL CHECK (type IN ('bug','feature_request')),
            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
            reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW());
            `
    );
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
      INSERT INTO users(name, email, password, role)
      VALUES($1, $2, $3,  COALESCE($4, 'contributor'))
      RETURNING *
      `,
    [name, email, hashedPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(`
            SELECT * FROM users WHERE email=$1
        `, [email]);
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!user || !matchPassword) {
    throw new Error("Invalid Credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const accessToken = jwt.sign(jwtPayload, config_default.jwtSecret, {
    expiresIn: "1D"
  });
  const refreshToken2 = jwt.sign(jwtPayload, config_default.refreshSecret, {
    expiresIn: "15D"
  });
  return { accessToken, refreshToken: refreshToken2, user };
};
var generateRefreshToken = async (token) => {
  if (!token) {
    throw new Error("Unauthorized access");
  }
  const decode = jwt.verify(
    token,
    config_default.refreshSecret
  );
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [decode.email]
  );
  const user = userData.rows[0];
  if (userData.rows.length === 0) {
    throw new Error("User not found");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
  const accessToken = jwt.sign(jwtPayload, config_default.jwtSecret, {
    expiresIn: "1D"
  });
  return { accessToken };
};
var authService = {
  createUserIntoDB,
  loginUser,
  generateRefreshToken
};

// src/modules/auth/auth.controller.ts
var signUp = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Registration successfull",
      data: result.rows[0]
    });
  } catch (error) {
    const err = error;
    sendResponse_default(
      res,
      {
        "statusCode": 500,
        "success": false,
        "message": err.message,
        "error": err
      }
    );
    console.log(err);
  }
};
var login = async (req, res) => {
  try {
    const { accessToken, refreshToken: refreshToken2, user } = await authService.loginUser(req.body);
    res.cookie("refreshToken", refreshToken2, {
      secure: true,
      httpOnly: true,
      sameSite: "lax"
    });
    sendResponse_default(res, {
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
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: 401,
      success: false,
      message: "Login failed",
      error: err.message
    });
  }
};
var refreshToken = async (req, res) => {
  try {
    const result = await authService.generateRefreshToken(req.cookies.refreshToken);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Access Token Generated",
      data: result
    });
  } catch (error) {
    console.log(error.message);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Access Token Generated",
      data: error.message
    });
  }
};
var authController = {
  signUp,
  login,
  refreshToken
};

// src/modules/auth/auth.routes.ts
var router = Router();
router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
var authRoute = router;

// src/app.ts
import cookieParser from "cookie-parser";

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, status, type, reporter_id } = payload;
  const user = await pool.query(
    `
            SELECT * FROM users WHERE id=$1
        `,
    [reporter_id]
  );
  if (user.rows.length === 0) {
    throw new Error("User not exist");
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
var getAllIssuesFromDB = async (sort, type, status) => {
  let query = `SELECT * FROM issues`;
  const params = [];
  const conditions = [];
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
      reporter: reporterData.rows[0]
    });
  }
  return issues;
};
var getSingleIssueFromDB = async (id) => {
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
    reporter: reporterData.rows[0]
  };
};
var updateIssueInDB = async (id, payload, user) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id=$1`, [id]);
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = result.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("Forbidden: You can only update your own issue");
    }
    if (issue.status !== "open") {
      throw new Error("Conflict: You can only update when status is open");
    }
  }
  const updated = await pool.query(
    `
    UPDATE issues
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        updated_at = CURRENT_TIMESTAMP
    WHERE id=$4
    RETURNING *
    `,
    [payload.title, payload.description, payload.type, id]
  );
  return updated.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(`
      DELETE FROM issues WHERE id=$1
    `, [id]);
  return result;
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var postIssues = async (req, res) => {
  try {
    const reporter_id = req.user.id;
    const issue = await issueService.createIssueIntoDB({ ...req.body, reporter_id });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: issue
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Failed to create issue",
      error: err.message
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const sort = req.query.sort || "newest";
    const type = req.query.type;
    const status = req.query.status;
    const issues = await issueService.getAllIssuesFromDB(sort, type, status);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: issues
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Failed to retrieve issues",
      error: err.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await issueService.getSingleIssueFromDB(id);
    if (!issue) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue NOT found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue Found",
      data: issue
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Failed to retrieve issue",
      error: err.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    const user = req.user;
    const updatedIssue = await issueService.updateIssueInDB(
      id,
      { title, description, type },
      user
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue
    });
  } catch (error) {
    const err = error;
    let statusCode = 500;
    if (err.message.includes("not found")) statusCode = 404;
    else if (err.message.includes("Forbidden")) statusCode = 403;
    else if (err.message.includes("Conflict")) statusCode = 409;
    sendResponse_default(res, {
      statusCode,
      success: false,
      message: "Failed to update issue",
      error: err.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user || user.role !== "maintainer") {
      return sendResponse_default(res, {
        statusCode: 403,
        success: false,
        message: "Forbidden: Only maintainers can delete issues"
      });
    }
    const result = await issueService.deleteIssueFromDB(id);
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "Issue NOT found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    const err = error;
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Failed to Delete Issue",
      error: err.message
    });
  }
};
var issuesController = {
  postIssues,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var authMiddleware = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access! No token provided"
        });
      }
      const decode = jwt2.verify(
        token,
        config_default.jwtSecret
      );
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
      req.user = user;
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
var auth_middleware_default = authMiddleware;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_middleware_default("contributor", "maintainer"), issuesController.postIssues);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch("/:id", auth_middleware_default("maintainer", "contributor"), issuesController.updateIssue);
router2.delete("/:id", auth_middleware_default("maintainer"), issuesController.deleteIssue);
var issuesRoute = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};

// src/app.ts
var app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(globalErrorHandler);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevPulse"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
var app_default = app;

// src/server.ts
var port = config_default.port;
var main = () => {
  initDB();
  app_default.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
main();
//# sourceMappingURL=server.js.map