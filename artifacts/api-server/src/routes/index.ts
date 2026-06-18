import { Router, type IRouter } from "express";
import healthRouter from "./health";
import progressRouter from "./progress";
import dailyLogsRouter from "./daily-logs";
import testsRouter from "./tests";
import targetsRouter from "./targets";
import quoteRouter from "./quote";

const router: IRouter = Router();

router.use(healthRouter);
router.use(progressRouter);
router.use(dailyLogsRouter);
router.use(testsRouter);
router.use(targetsRouter);
router.use(quoteRouter);

export default router;
