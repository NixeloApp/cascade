/** Loading skeleton for the roadmap Gantt chart. */

import { PageLayout } from "@/components/layout";
import { Card } from "../ui/Card";
import { Flex, FlexItem } from "../ui/Flex";
import { Grid } from "../ui/Grid";
import { Skeleton } from "../ui/Skeleton";
import { Stack } from "../ui/Stack";

/** Shimmer skeleton matching the roadmap layout while data loads. */
export function RoadmapLoadingState() {
  return (
    <PageLayout fullHeight className="overflow-hidden">
      <Flex direction="column" className="h-full">
        <Flex align="center" justify="between" className="mb-6 shrink-0">
          <Stack gap="xs">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </Stack>
          <Flex gap="md">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-8 w-32" />
          </Flex>
        </Flex>

        <Card variant="default" padding="none" className="flex-1 overflow-hidden">
          <div className="border-b border-ui-border bg-linear-to-b from-ui-bg-soft/94 via-ui-bg-elevated/96 to-ui-bg-secondary/78 p-4">
            <Flex>
              <FlexItem shrink={false} className="w-sidebar">
                <Skeleton className="h-5 w-24" />
              </FlexItem>
              <FlexItem flex="1">
                <Grid cols={6} gap="sm">
                  {[1, 2, 3, 4, 5, 6].map((id) => (
                    <Skeleton key={id} className="h-5 w-full" />
                  ))}
                </Grid>
              </FlexItem>
            </Flex>
          </div>

          <FlexItem flex="1">
            <Stack className="overflow-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="border-b border-ui-border">
                  <Flex align="center">
                    <FlexItem shrink={false} className="w-sidebar pr-4">
                      <Flex align="center" gap="sm">
                        <Skeleton className="size-4 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                      </Flex>
                      <Skeleton className="h-3 w-32" />
                    </FlexItem>
                    <FlexItem flex="1" className="relative h-8">
                      <div
                        className="absolute h-6"
                        style={{
                          left: `${(i * 13) % 70}%`,
                          width: `${10 + ((i * 3) % 10)}%`,
                        }}
                      >
                        <Skeleton className="h-full w-full rounded-full opacity-50" />
                      </div>
                    </FlexItem>
                  </Flex>
                </div>
              ))}
            </Stack>
          </FlexItem>
        </Card>
      </Flex>
    </PageLayout>
  );
}
