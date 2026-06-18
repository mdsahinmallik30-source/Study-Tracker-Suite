import { Router, type IRouter } from "express";
import healthRouter from "./health";
import progressRouter from "./progress";
import dailyLogsRouter from "./daily-logs";
import testsRouter from "./tests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(progressRouter);
router.use(dailyLogsRouter);
router.use(testsRouter);

export default router;
