import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { Flex } from "./Flex";
import { Typography } from "./Typography";

const mediaPreviewFrameVariants = cva("", {
  variants: {
    surface: {
      avatar: "relative",
      cover: "relative h-32 overflow-hidden border-dashed",
    },
  },
  defaultVariants: {
    surface: "cover",
  },
});

const mediaPreviewContentVariants = cva("", {
  variants: {
    surface: {
      avatar: "",
      cover: "h-full w-full",
    },
  },
  defaultVariants: {
    surface: "cover",
  },
});

const mediaPreviewImageVariants = cva("", {
  variants: {
    surface: {
      cover: "h-full w-full object-cover",
    },
  },
  defaultVariants: {
    surface: "cover",
  },
});

const mediaPreviewActionVariants = cva("", {
  variants: {
    placement: {
      avatarUpload: "absolute -bottom-1 -right-1",
      coverCorner: "absolute bottom-2 right-2 backdrop-blur-sm",
    },
  },
  defaultVariants: {
    placement: "coverCorner",
  },
});

interface MediaPreviewFrameProps
  extends VariantProps<typeof mediaPreviewFrameVariants>,
    Pick<React.ComponentPropsWithoutRef<typeof Card>, "padding" | "radius" | "variant">,
    Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function MediaPreviewFrame({
  action,
  children,
  className,
  padding = "none",
  radius = "md",
  surface = "cover",
  variant = "outline",
  ...divProps
}: MediaPreviewFrameProps) {
  if (surface === "avatar") {
    return (
      <div className={cn(mediaPreviewFrameVariants({ surface }), className)} {...divProps}>
        {children}
        {action}
      </div>
    );
  }

  return (
    <Card
      className={cn(mediaPreviewFrameVariants({ surface }), className)}
      padding={padding}
      radius={radius}
      variant={variant}
      {...divProps}
    >
      <div className={mediaPreviewContentVariants({ surface })}>{children}</div>
      {action}
    </Card>
  );
}

interface MediaPreviewImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "alt" | "className">,
    VariantProps<typeof mediaPreviewImageVariants> {}

export function MediaPreviewImage({
  alt,
  surface = "cover",
  ...props
}: MediaPreviewImageProps & { alt: string }) {
  return <img alt={alt} className={mediaPreviewImageVariants({ surface })} {...props} />;
}

export function MediaPreviewEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <Flex
      align="center"
      justify="center"
      className={mediaPreviewContentVariants({ surface: "cover" })}
    >
      {children}
    </Flex>
  );
}

interface MediaPreviewActionProps extends VariantProps<typeof mediaPreviewActionVariants> {
  children: React.ReactNode;
}

export function MediaPreviewAction({
  children,
  placement = "coverCorner",
}: MediaPreviewActionProps) {
  return <div className={mediaPreviewActionVariants({ placement })}>{children}</div>;
}

export function MediaPreviewFileCard({ file }: { file: File }) {
  return (
    <Card padding="sm" variant="flat">
      <Flex align="center" justify="between" gap="sm">
        <Typography variant="small">{file.name}</Typography>
        <Typography variant="caption" color="secondary">
          {(file.size / 1024).toFixed(0)} KB
        </Typography>
      </Flex>
    </Card>
  );
}

export const MediaPreview = MediaPreviewFrame;
