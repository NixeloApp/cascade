import { BookOpen, Bug, CheckSquare, CircleDot, Zap } from "@/lib/icons";
import { Icon, type IconSize } from "./Icon";

const TYPE_ICONS = {
  bug: Bug,
  story: BookOpen,
  epic: Zap,
  subtask: CircleDot,
  task: CheckSquare,
} as const;

type IssueType = keyof typeof TYPE_ICONS;

interface IssueTypeIconProps {
  /** The issue type */
  type: IssueType | string;
  /** Size preset */
  size?: IconSize;
  /** Additional className for the icon */
  className?: string;
}

/**
 * Icon for issue types (bug, story, epic, subtask, task).
 *
 * @example
 * ```tsx
 * <IssueTypeIcon type="bug" size="lg" />
 * <IssueTypeIcon type={issue.type} size="sm" className="shrink-0" />
 * ```
 */
export function IssueTypeIcon({ type, size = "md", className }: IssueTypeIconProps) {
  const icon = TYPE_ICONS[type as IssueType] ?? TYPE_ICONS.task;
  return <Icon icon={icon} size={size} className={className} />;
}
