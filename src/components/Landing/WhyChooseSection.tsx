import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Grid } from "../ui/Grid";
import { Typography } from "../ui/Typography";

export function WhyChooseSection() {
  const stats = [
    { value: 30, label: "Less time in meetings", category: "cyan" as const },
    { value: 10, label: "Fewer tools to manage", category: "indigo" as const },
    { value: 95, label: "Actually use it daily", category: "teal" as const },
    { value: 95, label: "Would recommend", category: "emerald" as const },
  ];

  return (
    <section className="px-6 py-24 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="bg-ui-bg-secondary border border-ui-border rounded-3xl p-12 backdrop-blur-md transition-colors shadow-xl shadow-black/5">
          <div className="text-center mb-16">
            <Typography
              variant="h2"
              className="text-3xl md:text-5xl font-bold mb-6 text-ui-text tracking-tight"
            >
              Teams actually like using it.
            </Typography>
            <Typography className="text-ui-text-secondary max-w-2xl mx-auto text-lg leading-relaxed">
              No training required. No "change management" needed. It just works.
            </Typography>
          </div>

          <Grid cols={1} colsSm={2} colsLg={4} gap="lg">
            {stats.map((stat, index) => (
              <StatItem key={stat.label} {...stat} delay={index * 150} />
            ))}
          </Grid>
        </div>
      </div>
    </section>
  );
}

function StatItem({
  value,
  label,
  category,
  delay,
}: {
  value: number;
  label: string;
  category: "cyan" | "indigo" | "teal" | "emerald";
  delay: number;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  // Premium Palette
  // Note: Brand colors often need specific overrides if semantic brand tokens aren't sufficient,
  // but we should strive to use standard tokens where possible.
  // We keep correct specific colors here as they are data-visualization/brand accents.
  const categoryStyles = {
    cyan: {
      valueColor: "text-brand-cyan-text",
      bar: "bg-brand-cyan-bg",
      track: "bg-brand-cyan-track",
    },
    indigo: {
      valueColor: "text-brand-indigo-text",
      bar: "bg-brand-indigo-bg",
      track: "bg-brand-indigo-track",
    },
    teal: {
      valueColor: "text-brand-teal-text",
      bar: "bg-brand-teal-bg",
      track: "bg-brand-teal-track",
    },
    emerald: {
      valueColor: "text-brand-emerald-text",
      bar: "bg-brand-emerald-bg",
      track: "bg-brand-emerald-track",
    },
  };

  const styles = categoryStyles[category];

  return (
    <div className="text-center group">
      <div
        className={cn(
          "text-5xl md:text-6xl font-extrabold mb-3 tracking-tighter transition-colors",
          styles.valueColor,
        )}
      >
        {value}%
      </div>
      <Typography
        variant="small"
        className="text-ui-text-secondary mb-6 font-medium text-sm uppercase tracking-wide"
      >
        {label}
      </Typography>
      <div className="relative h-2 w-full rounded-full overflow-hidden">
        <div className={cn("absolute inset-0 w-full h-full", styles.track)} />
        <div
          className={cn(
            "absolute inset-y-0 left-0 h-full rounded-full transition-all duration-1000 ease-out",
            styles.bar,
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
