import { Inter } from "next/font/google";
import { Metadata, Viewport } from "next";
import Providers from "@/components/providers";
import { ErrorBoundary } from "@/components/error-boundary";

import "./globals.css";

const fontSans = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: {
		default: "Claudia",
		template: "%s | Claudia",
	},
	description: "Modern web application with Next.js",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/favicon/favicon.svg", type: "image/svg+xml" },
			{ url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
		],
		apple: [
			{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
	},
	manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${fontSans.variable} font-sans antialiased`}>
				<ErrorBoundary>
					<Providers>{children}</Providers>
				</ErrorBoundary>
			</body>
		</html>
	);
}
