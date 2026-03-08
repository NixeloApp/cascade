import { Typography } from "../ui/Typography";

const logos = ["STRIPE", "VERCEL", "NOTION", "ANTHROPIC", "COINBASE", "PERPLEXITY"];

/** Social-proof strip below the landing hero. */
export function LogoBar() {
  return (
    <section className="border-y border-ui-border/20 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <Typography
          variant="meta"
          className="mb-6 text-center uppercase tracking-widest text-ui-text-tertiary"
        >
          Inspired by the workflows modern product teams expect
        </Typography>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-semibold tracking-widest text-ui-text-tertiary sm:gap-8">
          {logos.map((logo) => (
            <span
              key={logo}
              className="rounded-full border border-ui-border/40 bg-ui-bg-soft px-4 py-2 transition-colors duration-default hover:border-ui-border-secondary hover:text-ui-text"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
