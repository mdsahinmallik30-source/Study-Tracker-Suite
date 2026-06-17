import { Router, type IRouter } from "express";
import healthRouter from "./health";
import progressRouter from "./progress";
import dailyLogsRouter from "./daily-logs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(progressRouter);
router.use(dailyLogsRouter);

export default router;
