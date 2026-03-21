import { Card, getCardRecipeClassName } from "../ui/Card";
import { Container } from "../ui/Container";
import { Flex } from "../ui/Flex";
import { Typography } from "../ui/Typography";

const logos = ["STRIPE", "VERCEL", "NOTION", "ANTHROPIC", "COINBASE", "PERPLEXITY"];

/** Social-proof strip below the landing hero. */
export function LogoBar() {
  return (
    <section>
      <Card recipe="landingNavFrame" className="border-y border-ui-border/20 py-10">
        <Container size="lg">
          <Typography variant="eyebrowWide" className="mb-6 text-center">
            Inspired by the workflows modern product teams expect
          </Typography>

          <Flex align="center" justify="center" wrap gap="xl">
            {logos.map((logo) => (
              <span key={logo} className={getCardRecipeClassName("landingLogoChip")}>
                <Typography as="span" variant="eyebrowWide">
                  {logo}
                </Typography>
              </span>
            ))}
          </Flex>
        </Container>
      </Card>
    </section>
  );
}
