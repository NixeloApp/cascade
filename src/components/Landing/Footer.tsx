import { Flex } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";
import { NixeloLogo } from "./icons";

export function Footer() {
  return (
    <footer className="px-6 py-16 border-t border-ui-border/20 bg-transparent transition-colors">
      <div className="max-w-6xl mx-auto">
        <Grid cols={1} colsMd={5} className="gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Flex align="center" gap="sm" className="mb-4">
              <NixeloLogo />
              <Typography variant="h3" className="text-xl font-semibold">
                nixelo
              </Typography>
            </Flex>
            <Typography variant="muted" className="max-w-xs text-ui-text-secondary">
              Revolutionizing project management with intelligent automation and seamless
              collaboration.
            </Typography>
          </div>

          {/* Links */}
          <div>
            <Typography variant="h4" className="font-semibold mb-4 text-ui-text">
              Product
            </Typography>
            <ul className="space-y-2">
              {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
                <li key={item}>
                  <a
                    href="/"
                    className="text-ui-text-tertiary hover:text-ui-text text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Typography variant="h4" className="font-semibold mb-4 text-ui-text">
              organization
            </Typography>
            <ul className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href="/"
                    className="text-ui-text-tertiary hover:text-ui-text text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Typography variant="h4" className="font-semibold mb-4 text-ui-text">
              Resources
            </Typography>
            <ul className="space-y-2">
              {["Documentation", "Help Center", "API Reference", "Status"].map((item) => (
                <li key={item}>
                  <a
                    href="/"
                    className="text-ui-text-tertiary hover:text-ui-text text-sm transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Grid>

        <Flex
          direction="column"
          justify="between"
          align="center"
          gap="lg"
          className="pt-8 border-t border-ui-border/20 sm:flex-row"
        >
          <Typography variant="muted" className="text-ui-text-secondary">
            © 2026 Nixelo. All rights reserved.
          </Typography>
          <Flex align="center" gap="xl">
            {/* Social Links */}
            <a
              href="https://www.facebook.com/nixeloapp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ui-text-tertiary hover:text-ui-text transition-colors"
            >
              <span className="sr-only">Follow us on Facebook</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@nixeloapp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ui-text-tertiary hover:text-ui-text transition-colors"
            >
              <span className="sr-only">Follow us on TikTok</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
              </svg>
            </a>
            <a
              href="https://www.patreon.com/nixelo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ui-text-tertiary hover:text-ui-text transition-colors"
            >
              <span className="sr-only">Support us on Patreon</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.386 2c-3.848 0-6.966 3.118-6.966 6.966 0 3.847 3.118 6.965 6.966 6.965 3.847 0 6.965-3.118 6.965-6.965C22.351 5.118 19.233 2 15.386 2zM.649 22h3.818V2H.649v20z" />
              </svg>
            </a>
            <div className="h-4 w-px bg-ui-border-secondary" />
            <a
              href="/"
              className="text-ui-text-secondary hover:text-ui-text text-sm transition-colors"
            >
              Privacy
            </a>
            <a
              href="/"
              className="text-ui-text-secondary hover:text-ui-text text-sm transition-colors"
            >
              Terms
            </a>
            <a
              href="/"
              className="text-ui-text-secondary hover:text-ui-text text-sm transition-colors"
            >
              Cookies
            </a>
          </Flex>
        </Flex>
      </div>
    </footer>
  );
}
