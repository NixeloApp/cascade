import { ShieldCheck } from "@/lib/icons";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Container } from "../ui/Container";
import { Dot } from "../ui/Dot";
import { Flex, FlexItem } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { IconCircle } from "../ui/IconCircle";
import { Stack } from "../ui/Stack";
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

/** Landing page footer with richer structure and trust signals. */
export function Footer() {
  return (
    <footer className="border-t border-ui-border/20 bg-transparent px-6 py-16 transition-colors">
      <Container size="lg">
        <Stack gap="xl">
          <Grid cols={1} colsLg={5} gap="xl">
            <Stack gap="lg" className="lg:col-span-2">
              <Flex align="center" gap="sm">
                <NixeloLogo />
                <Typography as="span" variant="h4">
                  Nixelo
                </Typography>
              </Flex>
              <Typography variant="muted" className="max-w-md text-ui-text-secondary">
                The calmer way to run delivery: shared docs, clearer execution, and AI help that
                stays connected to the actual work.
              </Typography>
            </Stack>

            <Card recipe="landingStoryCard" padding="none" className="p-5 lg:col-span-3">
              <Flex align="start" gap="md">
                <IconCircle size="sm" variant="success">
                  <ShieldCheck className="size-5" />
                </IconCircle>
                <FlexItem flex="1">
                  <Typography variant="label">Enterprise-grade trust signals</Typography>
                  <Typography variant="small" color="secondary" className="mt-2">
                    Security-minded teams can move fast without divorcing planning, delivery, and
                    client communication into separate systems.
                  </Typography>
                </FlexItem>
                <Badge variant="outline" shape="pill" size="md" className="gap-2">
                  <Typography as="span" variant="meta" className="flex items-center gap-2">
                    <Dot color="success" />
                    All systems normal
                  </Typography>
                </Badge>
              </Flex>
            </Card>
          </Grid>

          <Grid cols={1} colsSm={2} colsLg={4} gap="lg">
            {footerColumns.map((column) => (
              <Stack key={column.title} gap="lg">
                <Typography as="h4" variant="cardTitle">
                  {column.title}
                </Typography>
                <Stack as="ul" gap="sm" className="list-none">
                  {column.links.map((item) => (
                    <li key={item}>
                      <Button
                        asChild
                        variant="unstyled"
                        chrome="footerLink"
                        chromeSize="footerLink"
                      >
                        <a href="/">{item}</a>
                      </Button>
                    </li>
                  ))}
                </Stack>
              </Stack>
            ))}
          </Grid>

          <Flex
            direction="column"
            justify="between"
            align="center"
            gap="lg"
            className="border-t border-ui-border/20 pt-8 sm:flex-row"
          >
            <Typography variant="muted" className="text-ui-text-secondary">
              © 2026 Nixelo. All rights reserved.
            </Typography>

            <Flex align="center" gap="xl">
              <Button asChild variant="unstyled" chrome="footerSocial" chromeSize="footerSocial">
                <a
                  href="https://www.facebook.com/nixeloapp/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">Follow us on Facebook</span>
                  <svg
                    className="size-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </Button>
              <Button asChild variant="unstyled" chrome="footerSocial" chromeSize="footerSocial">
                <a
                  href="https://www.tiktok.com/@nixeloapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">Follow us on TikTok</span>
                  <svg
                    className="size-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                </a>
              </Button>
              <Button asChild variant="unstyled" chrome="footerSocial" chromeSize="footerSocial">
                <a href="https://www.patreon.com/nixelo" target="_blank" rel="noopener noreferrer">
                  <span className="sr-only">Support us on Patreon</span>
                  <svg
                    className="size-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M15.386 2c-3.848 0-6.966 3.118-6.966 6.966 0 3.847 3.118 6.965 6.966 6.965 3.847 0 6.965-3.118 6.965-6.965C22.351 5.118 19.233 2 15.386 2zM.649 22h3.818V2H.649v20z" />
                  </svg>
                </a>
              </Button>
            </Flex>
          </Flex>
        </Stack>
      </Container>
    </footer>
  );
}
