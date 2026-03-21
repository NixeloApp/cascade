import type * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Stack } from "./Stack";
import { Typography, type TypographyProps } from "./Typography";

type SectionIntroAlign = "start" | "center";

interface SectionIntroOwnProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: SectionIntroAlign;
  titleVariant?: TypographyProps["variant"];
  titleColor?: TypographyProps["color"];
  descriptionVariant?: TypographyProps["variant"];
  descriptionColor?: TypographyProps["color"];
  titleClassName?: string;
  descriptionClassName?: string;
}

type SectionIntroProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & SectionIntroOwnProps;

/** Shared intro block for sections with optional eyebrow, title, and description. */
export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "start",
  titleVariant = "landingSectionTitle",
  descriptionVariant = "lead",
  titleColor,
  descriptionColor,
  className,
  titleClassName,
  descriptionClassName,
  ...props
}: SectionIntroProps) {
  const stackAlign = align === "center" ? "center" : "start";

  return (
    <Stack
      gap="md"
      align={stackAlign}
      className={cn(align === "center" ? "text-center" : "text-left", className)}
      {...props}
    >
      {eyebrow ? (
        <Badge variant="outline" shape="pill" className="w-fit">
          {eyebrow}
        </Badge>
      ) : null}

      <Stack gap="sm" align={stackAlign}>
        <Typography variant={titleVariant} color={titleColor} className={titleClassName}>
          {title}
        </Typography>
        {description ? (
          <Typography
            variant={descriptionVariant}
            color={descriptionColor}
            className={cn(align === "center" && "max-w-3xl", descriptionClassName)}
          >
            {description}
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
}
