import { cva, type VariantProps } from "class-variance-authority";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Flex } from "./Flex";

const carouselVariants = cva("relative w-full overflow-hidden", {
  variants: {
    variant: {
      default: "",
      contained: "bg-ui-bg-soft rounded-container border border-ui-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CarouselProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof carouselVariants> {
  /** Index of the currently active slide */
  activeIndex?: number;
  /** Callback when slide changes */
  onSlideChange?: (index: number) => void;
  /** Auto-advance slides (in milliseconds) */
  autoPlay?: number;
  /** Show navigation arrows */
  showNavigation?: boolean;
  /** Show indicator dots */
  showIndicators?: boolean;
  /** Enable looping at the end */
  loop?: boolean;
}

interface CarouselContextValue {
  activeIndex: number;
  totalSlides: number;
  goToSlide: (index: number) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  registerSlide: () => number;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("Carousel components must be used within a Carousel");
  }
  return context;
}

/**
 * Carousel component with Mintlify-inspired styling.
 *
 * @example
 * // Basic usage
 * <Carousel showNavigation showIndicators>
 *   <CarouselContent>
 *     <CarouselSlide>Slide 1</CarouselSlide>
 *     <CarouselSlide>Slide 2</CarouselSlide>
 *     <CarouselSlide>Slide 3</CarouselSlide>
 *   </CarouselContent>
 * </Carousel>
 *
 * @example
 * // With auto-play
 * <Carousel autoPlay={5000} loop>
 *   <CarouselContent>
 *     <CarouselSlide>Slide 1</CarouselSlide>
 *     <CarouselSlide>Slide 2</CarouselSlide>
 *   </CarouselContent>
 * </Carousel>
 */
const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      className,
      variant,
      activeIndex: controlledIndex,
      onSlideChange,
      autoPlay,
      showNavigation = true,
      showIndicators = true,
      loop = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [internalIndex, setInternalIndex] = React.useState(0);
    const slideCountRef = React.useRef(0);
    const [totalSlides, setTotalSlides] = React.useState(0);

    const activeIndex = controlledIndex ?? internalIndex;

    const registerSlide = () => {
      const index = slideCountRef.current;
      slideCountRef.current += 1;
      return index;
    };

    // Update total slides count after all slides are registered
    React.useEffect(() => {
      setTotalSlides(slideCountRef.current);
    }, []);

    const goToSlide = React.useCallback(
      (index: number) => {
        const newIndex = loop
          ? (index + totalSlides) % totalSlides
          : Math.max(0, Math.min(index, totalSlides - 1));
        setInternalIndex(newIndex);
        onSlideChange?.(newIndex);
      },
      [totalSlides, loop, onSlideChange],
    );

    const goToPrevious = React.useCallback(() => {
      if (activeIndex === 0 && !loop) return;
      goToSlide(activeIndex - 1);
    }, [activeIndex, loop, goToSlide]);

    const goToNext = React.useCallback(() => {
      if (activeIndex === totalSlides - 1 && !loop) return;
      goToSlide(activeIndex + 1);
    }, [activeIndex, totalSlides, loop, goToSlide]);

    // Auto-play functionality
    React.useEffect(() => {
      if (!autoPlay || totalSlides <= 1) return;

      const interval = setInterval(() => {
        goToNext();
      }, autoPlay);

      return () => clearInterval(interval);
    }, [autoPlay, totalSlides, goToNext]);

    // Reset slide count when children change
    React.useEffect(() => {
      slideCountRef.current = 0;
    }, []);

    const contextValue = {
      activeIndex,
      totalSlides,
      goToSlide,
      goToPrevious,
      goToNext,
      registerSlide,
    };

    return (
      <CarouselContext.Provider value={contextValue}>
        <div ref={ref} className={cn(carouselVariants({ variant }), className)} {...props}>
          {children}
          {showNavigation && totalSlides > 1 && <CarouselNavigation />}
          {showIndicators && totalSlides > 1 && <CarouselIndicators />}
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

/**
 * Container for carousel slides.
 */
const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { activeIndex } = useCarousel();

    return (
      <div ref={ref} className={cn("overflow-hidden", className)} {...props}>
        <Flex
          className="transition-slow"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {children}
        </Flex>
      </div>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

/**
 * Individual slide within the carousel.
 */
const CarouselSlide = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full flex-shrink-0 p-4", className)} {...props}>
        {children}
      </div>
    );
  },
);
CarouselSlide.displayName = "CarouselSlide";

/**
 * Navigation buttons for the carousel.
 */
const CarouselNavigation = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { goToPrevious, goToNext, activeIndex, totalSlides } = useCarousel();

    const canGoPrevious = activeIndex > 0;
    const canGoNext = activeIndex < totalSlides - 1;

    return (
      <Flex ref={ref} align="center" className={cn("absolute inset-y-0", className)} {...props}>
        <button
          type="button"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
          className={cn(
            "absolute left-2 z-10 h-9 w-9 rounded-full",
            "bg-ui-bg-elevated border border-ui-border",
            "flex items-center justify-center",
            "transition-default",
            "hover:bg-ui-bg-hover hover:border-ui-border-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ui-bg-elevated disabled:hover:border-ui-border",
            "shadow-soft",
          )}
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4 text-ui-text-secondary" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          disabled={!canGoNext}
          className={cn(
            "absolute right-2 z-10 h-9 w-9 rounded-full",
            "bg-ui-bg-elevated border border-ui-border",
            "flex items-center justify-center",
            "transition-default",
            "hover:bg-ui-bg-hover hover:border-ui-border-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ui-bg-elevated disabled:hover:border-ui-border",
            "shadow-soft",
          )}
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4 text-ui-text-secondary" />
        </button>
      </Flex>
    );
  },
);
CarouselNavigation.displayName = "CarouselNavigation";

/**
 * Indicator dots for the carousel.
 */
const CarouselIndicators = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { activeIndex, totalSlides, goToSlide } = useCarousel();

    return (
      <Flex
        ref={ref}
        gap="sm"
        justify="center"
        className={cn("absolute bottom-4 left-0 right-0", className)}
        {...props}
      >
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goToSlide(index)}
            className={cn(
              "h-2 rounded-full transition-default",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring focus-visible:ring-offset-2",
              index === activeIndex
                ? "w-6 bg-brand"
                : "w-2 bg-ui-text-tertiary hover:bg-ui-text-secondary",
            )}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </Flex>
    );
  },
);
CarouselIndicators.displayName = "CarouselIndicators";

export {
  Carousel,
  CarouselContent,
  CarouselSlide,
  CarouselNavigation,
  CarouselIndicators,
  useCarousel,
};
