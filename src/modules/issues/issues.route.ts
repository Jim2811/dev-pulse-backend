import { Router } from "express";
import { issuesController } from "./issues.controller";

const router = Router()
router.post('/', issuesController.postIssues)
export const issuesRoute = router