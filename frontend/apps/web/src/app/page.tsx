"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, FolderCode } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex items-center justify-center p-4" style={{ height: "100vh" }}>
        <div className="w-full max-w-4xl">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="rotating-symbol"></span>
              Welcome to Claudia
            </h1>
          </motion.div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* CC Agents Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card 
                className="h-64 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border border-border/50 shimmer-hover trailing-border"
                onClick={() => window.location.href = '/agents'}
              >
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <Bot className="h-16 w-16 mb-4 text-primary" />
                  <h2 className="text-xl font-semibold">CC Agents</h2>
                </div>
              </Card>
            </motion.div>

            {/* CC Projects Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card 
                className="h-64 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border border-border/50 shimmer-hover trailing-border"
                onClick={() => window.location.href = '/projects'}
              >
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <FolderCode className="h-16 w-16 mb-4 text-primary" />
                  <h2 className="text-xl font-semibold">CC Projects</h2>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}