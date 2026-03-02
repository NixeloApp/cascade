import type { LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Bug,
  Calendar,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Clock,
  FileText,
  Flag,
  Folder,
  FolderKanban,
  Gem,
  Hash,
  KanbanSquare,
  LayoutGrid,
  Lightbulb,
  LinkIcon,
  ListChecks,
  ListTodo,
  MessageSquare,
  PieChart,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  User,
  Users,
  Wrench,
  Zap,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Input } from "./Input";
import { Tooltip } from "./Tooltip";
import { Typography } from "./Typography";

export const LUCIDE_ICON_PREFIX = "lucide:";

const EMOJI_FALLBACKS = ["📄", "📝", "📋", "🚀", "✅", "💡", "🎯", "📊"] as const;

type IconOption = {
  name: string;
  icon: LucideIcon;
  keywords: string[];
};

export type TemplateIconValue =
  | string
  | {
      type: "lucide";
      name: string;
    }
  | {
      type: "emoji";
      value: string;
    };

const ICON_OPTIONS: IconOption[] = [
  { name: "FileText", icon: FileText, keywords: ["document", "page", "note"] },
  { name: "BookOpen", icon: BookOpen, keywords: ["docs", "knowledge", "guide"] },
  { name: "ClipboardList", icon: ClipboardList, keywords: ["checklist", "tasks", "todo"] },
  { name: "CheckSquare", icon: CheckSquare, keywords: ["done", "task", "complete"] },
  { name: "ListChecks", icon: ListChecks, keywords: ["items", "checklist"] },
  { name: "ListTodo", icon: ListTodo, keywords: ["backlog", "todo"] },
  { name: "Calendar", icon: Calendar, keywords: ["date", "schedule"] },
  { name: "CalendarDays", icon: CalendarDays, keywords: ["planning", "timeline"] },
  { name: "Clock", icon: Clock, keywords: ["time", "tracking"] },
  { name: "Target", icon: Target, keywords: ["goal", "objective"] },
  { name: "Rocket", icon: Rocket, keywords: ["launch", "ship"] },
  { name: "Lightbulb", icon: Lightbulb, keywords: ["idea", "brainstorm"] },
  { name: "Bug", icon: Bug, keywords: ["issue", "defect"] },
  { name: "Users", icon: Users, keywords: ["team", "group"] },
  { name: "User", icon: User, keywords: ["person", "owner"] },
  { name: "Briefcase", icon: Briefcase, keywords: ["business", "work"] },
  { name: "KanbanSquare", icon: KanbanSquare, keywords: ["board", "workflow"] },
  { name: "LayoutGrid", icon: LayoutGrid, keywords: ["grid", "blocks"] },
  { name: "FolderKanban", icon: FolderKanban, keywords: ["project", "board"] },
  { name: "Folder", icon: Folder, keywords: ["files", "docs"] },
  { name: "Flag", icon: Flag, keywords: ["priority", "milestone"] },
  { name: "Star", icon: Star, keywords: ["favorite", "important"] },
  { name: "Sparkles", icon: Sparkles, keywords: ["magic", "highlight"] },
  { name: "Zap", icon: Zap, keywords: ["speed", "quick"] },
  { name: "ShieldCheck", icon: ShieldCheck, keywords: ["secure", "trust"] },
  { name: "Settings", icon: Settings, keywords: ["config", "preferences"] },
  { name: "Wrench", icon: Wrench, keywords: ["tools", "maintenance"] },
  { name: "TrendingUp", icon: TrendingUp, keywords: ["growth", "analytics"] },
  { name: "PieChart", icon: PieChart, keywords: ["metrics", "data"] },
  { name: "BarChart3", icon: BarChart3, keywords: ["chart", "report"] },
  { name: "Bell", icon: Bell, keywords: ["alerts", "notifications"] },
  { name: "MessageSquare", icon: MessageSquare, keywords: ["comment", "chat"] },
  { name: "Hash", icon: Hash, keywords: ["tag", "id"] },
  { name: "LinkIcon", icon: LinkIcon, keywords: ["url", "reference"] },
  { name: "Gem", icon: Gem, keywords: ["premium", "special"] },
];

const ICON_GRID_COLUMNS = 6;

function parseLucideName(value: string): string | null {
  if (!value.startsWith(LUCIDE_ICON_PREFIX)) {
    return null;
  }
  return value.slice(LUCIDE_ICON_PREFIX.length);
}

function formatOptionLabel(option: IconOption): string {
  return option.name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function getSelectedOption(value: TemplateIconValue): IconOption | undefined {
  const selectedName = parseLucideName(toTemplateIconString(value));
  if (!selectedName) {
    return undefined;
  }
  return ICON_OPTIONS.find((option) => option.name === selectedName);
}

interface TemplateIconProps {
  value: TemplateIconValue;
  className?: string;
}

export function TemplateIcon({ value, className }: TemplateIconProps) {
  const stringValue = toTemplateIconString(value);
  const selected = getSelectedOption(stringValue);
  if (selected) {
    return <Icon icon={selected.icon} className={cn("w-6 h-6", className)} aria-hidden="true" />;
  }
  return (
    <span className={cn("inline-flex items-center justify-center", className)} aria-hidden="true">
      {stringValue || "📄"}
    </span>
  );
}

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function IconPicker({ value, onChange, disabled = false }: IconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filteredOptions = !searchQuery.trim()
    ? ICON_OPTIONS
    : ICON_OPTIONS.filter((option) => {
        const query = searchQuery.trim().toLowerCase();
        const label = formatOptionLabel(option).toLowerCase();
        const keywordMatch = option.keywords.some((keyword) => keyword.includes(query));
        return label.includes(query) || option.name.toLowerCase().includes(query) || keywordMatch;
      });

  const selectedOption = getSelectedOption(value);
  const selectedLabel = selectedOption ? formatOptionLabel(selectedOption) : value;
  const previewValue = hoveredValue ?? value;

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const lastIndex = filteredOptions.length - 1;
    if (lastIndex < 0) {
      return;
    }

    let nextIndex = index;
    if (event.key === "ArrowRight") {
      nextIndex = Math.min(index + 1, lastIndex);
    } else if (event.key === "ArrowLeft") {
      nextIndex = Math.max(index - 1, 0);
    } else if (event.key === "ArrowDown") {
      nextIndex = Math.min(index + ICON_GRID_COLUMNS, lastIndex);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(index - ICON_GRID_COLUMNS, 0);
    }

    optionRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-ui-border bg-ui-bg-tertiary p-3">
        <FlexRow label="Selected">
          <TemplateIcon value={previewValue} className="w-5 h-5" />
          <Typography variant="small" color="secondary">
            {selectedLabel || "No icon selected"}
          </Typography>
        </FlexRow>
      </div>

      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search icons"
        aria-label="Search icons"
        disabled={disabled}
      />

      <div className="grid grid-cols-6 gap-2" role="listbox" aria-label="Lucide icons">
        {filteredOptions.map((option, index) => {
          const iconValue = `${LUCIDE_ICON_PREFIX}${option.name}`;
          const isSelected = value === iconValue;
          return (
            <Tooltip key={option.name} content={formatOptionLabel(option)}>
              <Button
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                variant={isSelected ? "primary" : "outline"}
                size="icon"
                aria-label={`Select ${formatOptionLabel(option)} icon`}
                aria-selected={isSelected}
                disabled={disabled}
                onClick={() => onChange(iconValue)}
                onMouseEnter={() => setHoveredValue(iconValue)}
                onMouseLeave={() => setHoveredValue(null)}
                onKeyDown={(event) => handleGridKeyDown(event, index)}
              >
                <Icon icon={option.icon} size="sm" aria-hidden="true" />
              </Button>
            </Tooltip>
          );
        })}
      </div>

      <div className="space-y-2">
        <Typography variant="small" color="secondary">
          Emoji fallback
        </Typography>
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_FALLBACKS.map((emoji) => (
            <Button
              key={emoji}
              type="button"
              variant={value === emoji ? "primary" : "outline"}
              size="icon"
              aria-label={`Select ${emoji} emoji`}
              disabled={disabled}
              onClick={() => onChange(emoji)}
              onMouseEnter={() => setHoveredValue(emoji)}
              onMouseLeave={() => setHoveredValue(null)}
            >
              <span aria-hidden="true">{emoji}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function toTemplateIconString(value: TemplateIconValue): string {
  if (typeof value === "string") {
    return value;
  }
  if (value.type === "lucide") {
    return `${LUCIDE_ICON_PREFIX}${value.name}`;
  }
  return value.value;
}

function FlexRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Typography variant="small" color="secondary">
        {label}:
      </Typography>
      {children}
    </div>
  );
}
