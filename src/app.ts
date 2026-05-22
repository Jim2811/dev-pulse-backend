import express, { type Application, type Request, type Response }  from "express";
import cors from "cors";
import { authRoute } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import { issuesRoute } from "./modules/issues/issues.route";
import { globalErrorHandler } from "./middleware/globalErrorHandler";



const app: Application = express();

app.use(cors()); 
app.use(express.json());
app.use(cookieParser());
app.use(globalErrorHandler);
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "DevPulse"
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute)

export default app;
