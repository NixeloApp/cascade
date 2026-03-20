import type { Id } from "@convex/_generated/dataModel";
import type { OutOfOfficeStatusSummary } from "./outOfOffice";

export interface UserSummary {
  _id: Id<"users">;
  name: string;
  image?: string;
}

export interface UserSummaryWithOutOfOffice extends UserSummary {
  outOfOffice?: OutOfOfficeStatusSummary;
}
