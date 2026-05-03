import { Link } from "react-router-dom";
import { RobotEyeLogo } from "@/components/RobotEyeLogo";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <RobotEyeLogo />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              Tool
            </Link>
            <Link to="/about" className="text-foreground">
              About
            </Link>
            <a
              href="https://www.linkedin.com/in/protmaks/"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              LinkedIn
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <article className="prose prose-slate max-w-none dark:prose-invert">
          <h1 className="mb-4 text-3xl font-semibold tracking-tight">About AllJSON</h1>
          <p className="text-muted-foreground">
            AllJSON is a free, fast, browser-based tool for working with JSON. It validates
            messy JSON, lets you explore it as an interactive tree, and turns clicked fields
            into BigQuery / Snowflake-style SQL — all without sending data anywhere.
          </p>

          <h2 className="mt-8 text-xl font-semibold">What it does</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm">
            <li>Validate JSON, including a lenient parser (unquoted keys, trailing commas, single quotes).</li>
            <li>Auto-format and pretty-print JSON.</li>
            <li>Explore data as a collapsible tree with key filtering.</li>
            <li>Click any field to copy its dot-notation path or build a SELECT statement.</li>
            <li>Flatten an entire JSON document into SQL columns with one click.</li>
            <li>Generate BigQuery / Snowflake style expressions, including <code>[OFFSET(i)]</code> for arrays.</li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold">Privacy</h2>
          <p className="text-sm text-muted-foreground">
            Everything runs locally in your browser. Your JSON never leaves your device — there
            is no backend, no upload, no tracking of input data.
          </p>

          <h2 className="mt-8 text-xl font-semibold">Who it's for</h2>
          <p className="text-sm text-muted-foreground">
            Data engineers, analysts, and developers who deal with deeply nested JSON payloads
            from APIs, event logs, or warehouses, and need to quickly turn them into queryable
            SQL.
          </p>

          <div className="mt-10">
            <Link
              to="/"
              className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              ← Back to the tool
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
};

export default About;
