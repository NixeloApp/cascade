import { cva } from "class-variance-authority";
import { ShieldCheck } from "@/lib/icons";
import { Flex, FlexItem } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";
import { NixeloLogo } from "./Icons";

const footerColumns = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "Help Center", "API Reference", "Status"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookies"],
  },
];

const footerVariants = {
  section: cva("border-t border-ui-border/20 bg-transparent px-6 py-16 transition-colors"),
  signalCard: cva("rounded-3xl border border-ui-border/40 bg-ui-bg-soft/80 p-5 lg:col-span-3"),
  signalIcon: cva("rounded-full bg-status-success/15 p-2 text-status-success-text"),
  statusChip: cva("rounded-full border border-ui-border/50 bg-ui-bg px-3 py-1"),
  statusMeta: cva("flex items-center gap-2"),
  list: cva("space-y-2"),
  link: cva("text-sm text-ui-text-tertiary transition-colors hover:text-ui-text"),
  bottomBar: cva("border-t border-ui-border/20 pt-8 sm:flex-row"),
  socialLink: cva("text-ui-text-tertiary transition-colors hover:text-ui-text"),
};

/** Landing page footer with richer structure and trust signals. */
export function Footer() {
  return (
    <footer className={footerVariants.section()}>
      <div className="mx-auto max-w-6xl">
        <Grid cols={1} colsLg={5} gap="xl" className="mb-10">
          <div className="lg:col-span-2">
            <Flex align="center" gap="sm" className="mb-4">
              <NixeloLogo />
              <Typography variant="h3" className="text-xl font-semibold">
                Nixelo
              </Typography>
            </Flex>
            <Typography variant="muted" className="max-w-md text-ui-text-secondary">
              The calmer way to run delivery: shared docs, clearer execution, and AI help that stays
              connected to the actual work.
            </Typography>
          </div>

          <div className={footerVariants.signalCard()}>
            <Flex align="start" gap="md">
              <div className={footerVariants.signalIcon()}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <FlexItem flex="1">
                <Typography variant="label">Enterprise-grade trust signals</Typography>
                <Typography variant="small" color="secondary" className="mt-2">
                  Security-minded teams can move fast without divorcing planning, delivery, and
                  client communication into separate systems.
                </Typography>
              </FlexItem>
              <div className={footerVariants.statusChip()}>
                <Typography variant="meta" className={footerVariants.statusMeta()}>
                  <span className="h-2 w-2 rounded-full bg-status-success-text" />
                  All systems normal
                </Typography>
              </div>
            </Flex>
          </div>
        </Grid>

        <Grid cols={1} colsSm={2} colsLg={4} gap="lg" className="mb-12">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <Typography variant="h4" className="mb-4 text-base">
                {column.title}
              </Typography>
              <ul className={footerVariants.list()}>
                {column.links.map((item) => (
                  <li key={item}>
                    <a href="/" className={footerVariants.link()}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Grid>

        <Flex
          direction="column"
          justify="between"
          align="center"
          gap="lg"
          className={footerVariants.bottomBar()}
        >
          <Typography variant="muted" className="text-ui-text-secondary">
            © 2026 Nixelo. All rights reserved.
          </Typography>

          <Flex align="center" gap="xl">
            <a
              href="https://www.facebook.com/nixeloapp/"
              target="_blank"
              rel="noopener noreferrer"
              className={footerVariants.socialLink()}
            >
              <span className="sr-only">Follow us on Facebook</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@nixeloapp"
              target="_blank"
              rel="noopener noreferrer"
              className={footerVariants.socialLink()}
            >
              <span className="sr-only">Follow us on TikTok</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </a>
            <a
              href="https://www.patreon.com/nixelo"
              target="_blank"
              rel="noopener noreferrer"
              className={footerVariants.socialLink()}
            >
              <span className="sr-only">Support us on Patreon</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.386 2c-3.848 0-6.966 3.118-6.966 6.966 0 3.847 3.118 6.965 6.966 6.965 3.847 0 6.965-3.118 6.965-6.965C22.351 5.118 19.233 2 15.386 2zM.649 22h3.818V2H.649v20z" />
              </svg>
            </a>
          </Flex>
        </Flex>
      </div>
    </footer>
  );
}
