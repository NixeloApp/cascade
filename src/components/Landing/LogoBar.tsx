import { cva } from "class-variance-authority";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

const logos = ["STRIPE", "VERCEL", "NOTION", "ANTHROPIC", "COINBASE", "PERPLEXITY"];

const logoBarVariants = {
  section: cva("border-y border-ui-border/20 px-6 py-10"),
  eyebrow: cva("mb-6 text-center uppercase tracking-widest text-ui-text-tertiary"),
  rail: cva("text-sm font-semibold tracking-widest text-ui-text-tertiary"),
  chip: cva(
    "rounded-full border border-ui-border/40 bg-ui-bg-soft px-4 py-2 transition-colors duration-default hover:border-ui-border-secondary hover:text-ui-text",
  ),
};

/** Social-proof strip below the landing hero. */
export function LogoBar() {
  return (
    <section className={logoBarVariants.section()}>
      <div className="mx-auto max-w-6xl">
        <Typography variant="meta" className={logoBarVariants.eyebrow()}>
          Inspired by the workflows modern product teams expect
        </Typography>

        <Flex align="center" justify="center" wrap gap="xl" className={logoBarVariants.rail()}>
          {logos.map((logo) => (
            <span key={logo} className={logoBarVariants.chip()}>
              {logo}
            </span>
          ))}
        </Flex>
      </div>
    </section>
  );
}
