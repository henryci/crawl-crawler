import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

interface QuestionListProps {
  questions: Question[];
  /** Called after a link is followed; guides use it to close their dialog. */
  onNavigate?: () => void;
  className?: string;
}

/**
 * A list of example questions, each linking to the view that answers it.
 * Shared by the home page and the per-page guides.
 */
export function QuestionList({ questions, onNavigate, className }: QuestionListProps) {
  if (questions.length === 0) return null;
  return (
    <ul className={cn("space-y-1.5", className)}>
      {questions.map((q) => (
        <li key={q.id}>
          <Link
            href={q.href}
            onClick={onNavigate}
            className="group flex items-start gap-2 rounded-md border border-border/60 bg-secondary/20 px-3 py-2 transition-colors hover:border-primary/50 hover:bg-secondary/50"
          >
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{q.question}</span>
              <span className="block text-xs text-muted-foreground leading-relaxed">{q.blurb}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
