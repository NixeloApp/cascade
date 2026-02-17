import type { Meta, StoryObj } from "@storybook/react";
import { ChevronDown, Play, Plus, Square } from "lucide-react";
import { useState } from "react";
import { formatDate, formatHours } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Flex } from "./ui/Flex";
import { Typography } from "./ui/Typography";

// =============================================================================
// Types
// =============================================================================

interface TimeEntry {
  id: string;
  duration: number; // in minutes
  description?: string;
  date: number;
  activity?: string;
  billable?: boolean;
  totalCost?: number;
}

// =============================================================================
// Presentational Components
// =============================================================================

function TimeProgress({
  estimatedHours,
  totalLoggedHours,
}: {
  estimatedHours: number;
  totalLoggedHours: number;
}) {
  const remainingHours = estimatedHours > 0 ? estimatedHours - totalLoggedHours : null;
  const isOverEstimate = remainingHours !== null && remainingHours < 0;

  if (estimatedHours > 0) {
    return (
      <div className="space-y-2">
        <Flex align="center" justify="between">
          <Typography variant="caption">
            {totalLoggedHours.toFixed(1)}h / {estimatedHours}h estimated
          </Typography>
          {remainingHours !== null && (
            <Typography
              variant="caption"
              className={isOverEstimate ? "text-status-error font-medium" : undefined}
            >
              {isOverEstimate ? "+" : ""}
              {Math.abs(remainingHours).toFixed(1)}h {isOverEstimate ? "over" : "remaining"}
            </Typography>
          )}
        </Flex>
        <div className="w-full bg-ui-bg-tertiary rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              isOverEstimate ? "bg-status-error" : "bg-brand",
            )}
            style={{
              width: `${Math.min((totalLoggedHours / estimatedHours) * 100, 100)}%`,
            }}
          />
        </div>
      </div>
    );
  }

  if (totalLoggedHours > 0) {
    return (
      <Typography variant="caption">
        <Typography variant="label" as="span">
          {totalLoggedHours.toFixed(1)}h
        </Typography>{" "}
        logged (no estimate set)
      </Typography>
    );
  }

  return <Typography variant="caption">No time logged yet</Typography>;
}

function TimeEntriesList({ entries }: { entries: TimeEntry[] }) {
  return (
    <div className="p-4 border-t border-ui-border bg-ui-bg-secondary space-y-2">
      {entries.map((entry) => {
        const hours = formatHours(entry.duration);
        const entryDate = formatDate(entry.date);

        return (
          <div key={entry.id} className="bg-ui-bg border border-ui-border rounded-lg p-3">
            <Flex align="start" justify="between">
              <div>
                <Typography variant="large" as="div">
                  {hours}h
                </Typography>
                {entry.description && (
                  <Typography variant="caption" className="mt-1">
                    {entry.description}
                  </Typography>
                )}
                <Flex align="center" gap="sm" className="mt-1">
                  <time
                    className="text-xs text-ui-text-tertiary"
                    dateTime={new Date(entry.date).toISOString()}
                  >
                    {entryDate}
                  </time>
                  {entry.activity && <Badge variant="neutral">{entry.activity}</Badge>}
                  {entry.billable && <Badge variant="success">Billable</Badge>}
                </Flex>
              </div>
              {entry.totalCost !== undefined && (
                <Typography variant="small" as="div" className="font-medium">
                  ${entry.totalCost.toFixed(2)}
                </Typography>
              )}
            </Flex>
          </div>
        );
      })}
    </div>
  );
}

interface TimeTrackerPresentationalProps {
  estimatedHours?: number;
  entries?: TimeEntry[];
  isTimerRunning?: boolean;
  runningTimerDuration?: string;
  billingEnabled?: boolean;
  showEntries?: boolean;
  onStartTimer?: () => void;
  onStopTimer?: () => void;
  onLogTime?: () => void;
  onToggleEntries?: () => void;
}

function TimeTrackerPresentational({
  estimatedHours = 0,
  entries = [],
  isTimerRunning = false,
  runningTimerDuration = "00:00:00",
  billingEnabled = false,
  showEntries: initialShowEntries = false,
  onStartTimer = () => {},
  onStopTimer = () => {},
  onLogTime = () => {},
  onToggleEntries = () => {},
}: TimeTrackerPresentationalProps) {
  const [showEntries, setShowEntries] = useState(initialShowEntries);

  const totalLoggedMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalLoggedHours = totalLoggedMinutes / 60;

  return (
    <div className="w-full max-w-md border border-ui-border rounded-lg bg-ui-bg overflow-hidden">
      {/* Header */}
      <Flex align="center" justify="between" className="px-4 py-3 border-b border-ui-border">
        <Typography variant="label">Time Tracking</Typography>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setShowEntries(!showEntries);
              onToggleEntries();
            }}
            className="text-sm text-ui-text-secondary hover:text-ui-text flex items-center gap-1"
          >
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showEntries && "rotate-180")}
            />
          </button>
        )}
      </Flex>

      {/* Progress */}
      <div className="px-4 py-3">
        <TimeProgress estimatedHours={estimatedHours} totalLoggedHours={totalLoggedHours} />
      </div>

      {/* Timer controls */}
      <Flex align="center" gap="sm" className="px-4 pb-3">
        {isTimerRunning ? (
          <>
            <Button variant="danger" size="sm" onClick={onStopTimer}>
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
            <Typography variant="label" className="font-mono">
              {runningTimerDuration}
            </Typography>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={onStartTimer}>
            <Play className="h-4 w-4 mr-1" />
            Start Timer
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onLogTime}>
          <Plus className="h-4 w-4 mr-1" />
          Log Time
        </Button>
      </Flex>

      {/* Entries list */}
      {showEntries && entries.length > 0 && <TimeEntriesList entries={entries} />}
    </div>
  );
}

// =============================================================================
// Mock Data
// =============================================================================

const mockEntries: TimeEntry[] = [
  {
    id: "entry-1",
    duration: 120, // 2 hours
    description: "Implemented user authentication flow",
    date: Date.now() - 86400000, // yesterday
    activity: "Development",
    billable: true,
    totalCost: 200,
  },
  {
    id: "entry-2",
    duration: 45, // 45 min
    description: "Code review and feedback",
    date: Date.now() - 172800000, // 2 days ago
    activity: "Review",
    billable: true,
    totalCost: 75,
  },
  {
    id: "entry-3",
    duration: 30, // 30 min
    description: "Bug fix for login validation",
    date: Date.now() - 259200000, // 3 days ago
    activity: "Bug Fix",
    billable: false,
  },
];

// =============================================================================
// Meta
// =============================================================================

const meta: Meta<typeof TimeTrackerPresentational> = {
  title: "Components/TimeTracker",
  component: TimeTrackerPresentational,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Time tracking widget for issues. Supports manual time logging, timer functionality, and progress tracking against estimates.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  args: {
    estimatedHours: 8,
    entries: mockEntries,
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker with estimate and logged entries.",
      },
    },
  },
};

export const NoTimeLogged: Story = {
  args: {
    estimatedHours: 4,
    entries: [],
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker with no time logged yet.",
      },
    },
  },
};

export const NoEstimate: Story = {
  args: {
    estimatedHours: 0,
    entries: mockEntries.slice(0, 2),
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker without an estimate set.",
      },
    },
  },
};

export const OverEstimate: Story = {
  args: {
    estimatedHours: 2,
    entries: mockEntries,
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker where logged time exceeds the estimate.",
      },
    },
  },
};

export const TimerRunning: Story = {
  args: {
    estimatedHours: 8,
    entries: mockEntries,
    isTimerRunning: true,
    runningTimerDuration: "01:23:45",
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker with an active timer running.",
      },
    },
  },
};

export const WithEntriesExpanded: Story = {
  args: {
    estimatedHours: 8,
    entries: mockEntries,
    showEntries: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker with the entries list expanded.",
      },
    },
  },
};

export const WithBilling: Story = {
  args: {
    estimatedHours: 10,
    entries: mockEntries,
    billingEnabled: true,
    showEntries: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker with billing enabled, showing costs.",
      },
    },
  },
};

export const SingleEntry: Story = {
  args: {
    estimatedHours: 4,
    entries: [mockEntries[0]],
    showEntries: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker with a single time entry.",
      },
    },
  },
};

export const AlmostComplete: Story = {
  args: {
    estimatedHours: 4,
    entries: [
      {
        id: "entry-1",
        duration: 210, // 3.5 hours
        description: "Implementation work",
        date: Date.now(),
        activity: "Development",
        billable: true,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Time tracker nearing the estimated time.",
      },
    },
  },
};

export const ProgressOnly: Story = {
  render: () => (
    <div className="w-80 p-4 space-y-6">
      <div>
        <Typography variant="small" color="secondary" className="mb-2">
          Under estimate
        </Typography>
        <TimeProgress estimatedHours={8} totalLoggedHours={3.5} />
      </div>
      <div>
        <Typography variant="small" color="secondary" className="mb-2">
          Near complete
        </Typography>
        <TimeProgress estimatedHours={8} totalLoggedHours={7.5} />
      </div>
      <div>
        <Typography variant="small" color="secondary" className="mb-2">
          Over estimate
        </Typography>
        <TimeProgress estimatedHours={8} totalLoggedHours={10.5} />
      </div>
      <div>
        <Typography variant="small" color="secondary" className="mb-2">
          No estimate
        </Typography>
        <TimeProgress estimatedHours={0} totalLoggedHours={5} />
      </div>
      <div>
        <Typography variant="small" color="secondary" className="mb-2">
          No time logged
        </Typography>
        <TimeProgress estimatedHours={0} totalLoggedHours={0} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of different progress bar states.",
      },
    },
  },
};
