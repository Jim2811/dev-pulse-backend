import express, { type Application, type Request, type Response }  from "express";
import cors from "cors";
import { authRoute } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import { issuesRoute } from "./modules/issues/issues.route";
import authMiddleware from "./middleware/auth.middleware";



const app: Application = express();

app.use(cors()); 
app.use(express.json());
app.use(cookieParser());
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "This is home"
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues",authMiddleware("contributor","maintainer"), issuesRoute)

export default app;
