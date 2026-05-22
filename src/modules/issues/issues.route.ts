import { Router } from "express";
import { issuesController } from "./issues.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router()
router.post('/', authMiddleware("contributor","maintainer"),issuesController.postIssues)
router.get('/', issuesController.getAllIssues )
router.get('/:id', issuesController.getSingleIssue )
router.patch('/:id',  authMiddleware("maintainer","contributor"), issuesController.updateIssue )
router.delete('/:id',  authMiddleware("maintainer"), issuesController.deleteIssue )
export const issuesRoute = router