import express, { type Application, type Request, type Response }  from "express";
import cors from "cors";
import { authRoute } from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";



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

export default app;
