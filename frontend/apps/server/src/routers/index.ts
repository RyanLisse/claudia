import { publicProcedure, router } from "../lib/trpc";
import { agentsRouter } from "./agents.js";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	agents: agentsRouter,
});
export type AppRouter = typeof appRouter;
