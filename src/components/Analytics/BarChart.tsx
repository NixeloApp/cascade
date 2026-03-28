import {
  type BarChartTone,
  getBarChartFillClassName,
  getBarChartTrackClassName,
} from "../ui/barChartSurfaceClassNames";
import { Flex, FlexItem } from "../ui/Flex";
import { Typography } from "../ui/Typography";

interface BarChartDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDatum[];
  tone: BarChartTone;
}

/** Horizontal analytics bar chart with wrapper-owned fill and track surfaces. */
export function BarChart({ data, tone }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Flex direction="column" justify="end" gap="sm" className="h-full">
      {data.map((item) => (
        <Flex key={item.label} gap="sm" align="center">
          <Typography variant="small" className="w-24 text-ui-text truncate" title={item.label}>
            {item.label}
          </Typography>
          <FlexItem flex="1" className={getBarChartTrackClassName()}>
            <Flex
              align="center"
              justify="end"
              className={getBarChartFillClassName(tone)}
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                minWidth: item.value > 0 ? "2rem" : "0",
              }}
            >
              <Typography variant="label" className="text-ui-text-inverse drop-shadow-sm">
                {item.value}
              </Typography>
            </Flex>
          </FlexItem>
        </Flex>
      ))}
    </Flex>
  );
}
