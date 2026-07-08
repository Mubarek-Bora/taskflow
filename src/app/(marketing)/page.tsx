"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-gradient-from to-gradient-via opacity-30 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-gradient-to-br from-gradient-via to-gradient-to opacity-25 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-primary to-gradient-to opacity-20 blur-3xl"
          animate={{ x: [0, 25, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          TaskFlow
        </span>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Organize projects.{" "}
          <span className="bg-gradient-to-r from-gradient-from via-gradient-via to-gradient-to bg-clip-text text-transparent">
            Ship tasks.
          </span>{" "}
          Stay on top of deadlines.
        </h1>
        <p className="mt-5 max-w-md text-lg text-muted-foreground">
          A clean, fast task and project tracker with real-time boards and a dashboard built for
          focus.
        </p>
        <div className="mt-9 flex gap-3">
          <Link href="/register">
            <Button size="lg" className="glow-primary">
              Get started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Log in
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
