"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Mic, Paperclip, Send, Square, User } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Textarea } from "./ui/textarea";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant" | "system";
	content: string;
	timestamp: Date;
	attachments?: Attachment[];
	metadata?: {
		model?: string;
		tokens?: number;
		processing_time?: number;
	};
}

export interface Attachment {
	id: string;
	name: string;
	type: string;
	size: number;
	url?: string;
}

interface ChatInterfaceProps {
	messages: ChatMessage[];
	onSendMessage: (content: string, attachments?: File[]) => void;
	isLoading?: boolean;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	maxHeight?: string;
	showTypingIndicator?: boolean;
	agentName?: string;
}

/**
 * Responsive chat interface with real-time messaging
 *
 * @example
 * <ChatInterface
 *   messages={messages}
 *   onSendMessage={(content, files) => sendMessage(content, files)}
 *   isLoading={isProcessing}
 *   agentName="Claude Assistant"
 * />
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
	messages,
	onSendMessage,
	isLoading = false,
	placeholder = "Type your message...",
	disabled = false,
	className,
	maxHeight = "600px",
	showTypingIndicator = false,
	agentName = "Assistant",
}) => {
	const [inputValue, setInputValue] = useState("");
	const [attachments, setAttachments] = useState<File[]>([]);
	const [isRecording, setIsRecording] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	}, []);

	const handleSend = () => {
		if (!inputValue.trim() && attachments.length === 0) return;

		onSendMessage(inputValue.trim(), attachments);
		setInputValue("");
		setAttachments([]);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		setAttachments((prev) => [...prev, ...files]);
	};

	const removeAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatTime = (date: Date): string => {
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className={cn("flex h-full flex-col", className)}>
			{/* Messages Area */}
			<div
				className="flex-1 space-y-4 overflow-y-auto p-4"
				style={{ maxHeight }}
			>
				<AnimatePresence>
					{messages.map((message) => (
						<motion.div
							key={message.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{ duration: 0.3 }}
							className={cn(
								"flex gap-3",
								message.role === "user" ? "justify-end" : "justify-start",
							)}
						>
							{message.role !== "user" && (
								<div className="flex-shrink-0">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
										<Bot className="h-4 w-4 text-primary" />
									</div>
								</div>
							)}

							<Card
								className={cn(
									"max-w-[70%] break-words",
									message.role === "user"
										? "bg-primary text-primary-foreground"
										: "bg-muted",
								)}
							>
								<CardContent className="p-3">
									<div className="space-y-2">
										<p className="whitespace-pre-wrap text-sm">
											{message.content}
										</p>

										{/* Attachments */}
										{message.attachments && message.attachments.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{message.attachments.map((attachment) => (
													<Badge
														key={attachment.id}
														variant="secondary"
														className="text-xs"
													>
														{attachment.name}
													</Badge>
												))}
											</div>
										)}

										{/* Metadata */}
										<div className="flex items-center justify-between text-xs opacity-70">
											<span>{formatTime(message.timestamp)}</span>
											{message.metadata && (
												<div className="flex items-center gap-2">
													{message.metadata.model && (
														<span>{message.metadata.model}</span>
													)}
													{message.metadata.tokens && (
														<span>{message.metadata.tokens} tokens</span>
													)}
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>

							{message.role === "user" && (
								<div className="flex-shrink-0">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
										<User className="h-4 w-4 text-primary" />
									</div>
								</div>
							)}
						</motion.div>
					))}
				</AnimatePresence>

				{/* Typing Indicator */}
				{showTypingIndicator && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex gap-3"
					>
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
							<Bot className="h-4 w-4 text-primary" />
						</div>
						<Card className="bg-muted">
							<CardContent className="p-3">
								<div className="flex items-center gap-2">
									<div className="flex gap-1">
										<div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
										<div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
										<div className="h-2 w-2 animate-bounce rounded-full bg-current" />
									</div>
									<span className="text-muted-foreground text-xs">
										{agentName} is typing...
									</span>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<div className="space-y-3 border-t p-4">
				{/* Attachments */}
				{attachments.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{attachments.map((file, index) => (
							<Badge
								key={index}
								variant="secondary"
								className="flex items-center gap-2"
							>
								<span className="text-xs">{file.name}</span>
								<span className="text-xs opacity-70">
									({formatFileSize(file.size)})
								</span>
								<Button
									variant="ghost"
									size="sm"
									className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
									onClick={() => removeAttachment(index)}
								>
									×
								</Button>
							</Badge>
						))}
					</div>
				)}

				<div className="flex gap-2">
					<div className="relative flex-1">
						<Textarea
							ref={textareaRef}
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder={placeholder}
							disabled={disabled || isLoading}
							className="max-h-32 min-h-[44px] resize-none pr-12"
							rows={1}
						/>

						{/* Attachment Button */}
						<Button
							variant="ghost"
							size="sm"
							className="absolute top-2 right-2 h-6 w-6 p-0"
							onClick={() => fileInputRef.current?.click()}
							disabled={disabled || isLoading}
						>
							<Paperclip className="h-4 w-4" />
						</Button>
					</div>

					{/* Voice Recording Button */}
					<Button
						variant="outline"
						size="icon"
						className="h-11 w-11"
						disabled={disabled || isLoading}
						onMouseDown={() => setIsRecording(true)}
						onMouseUp={() => setIsRecording(false)}
						onMouseLeave={() => setIsRecording(false)}
					>
						{isRecording ? (
							<Square className="h-4 w-4 text-red-500" />
						) : (
							<Mic className="h-4 w-4" />
						)}
					</Button>

					{/* Send Button */}
					<Button
						onClick={handleSend}
						disabled={
							disabled ||
							isLoading ||
							(!inputValue.trim() && attachments.length === 0)
						}
						className="h-11 w-11"
						size="icon"
					>
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
					</Button>
				</div>
			</div>

			{/* Hidden File Input */}
			<input
				ref={fileInputRef}
				type="file"
				multiple
				className="hidden"
				onChange={handleFileSelect}
			/>
		</div>
	);
};
