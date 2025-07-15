"use client";

import { useRouter } from "next/navigation";

interface ErrorProps {
	statusCode?: number;
	hasGetInitialPropsRun?: boolean;
	err?: Error & { statusCode?: number };
}

function Error({ statusCode }: ErrorProps) {
	const router = useRouter();

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<h1 className="mb-4 font-bold text-4xl">
					{statusCode
						? `An error ${statusCode} occurred on server`
						: "An error occurred on client"}
				</h1>
				<button
					onClick={() => router.push("/")}
					className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
				>
					Go Home
				</button>
			</div>
		</div>
	);
}

Error.getInitialProps = ({ res, err }: any) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};

export default Error;
