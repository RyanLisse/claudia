"use client";

import type { NextPageContext } from "next";

interface ErrorProps {
	statusCode: number;
}

function Error({ statusCode }: ErrorProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="text-center">
				<h1 className="mb-4 font-bold text-4xl">
					{statusCode
						? `An error ${statusCode} occurred on server`
						: "An error occurred on client"}
				</h1>
				<a
					href="/"
					className="inline-block rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
				>
					Go Home
				</a>
			</div>
		</div>
	);
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode };
};

export default Error;
