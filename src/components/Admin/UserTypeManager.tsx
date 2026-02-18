import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { Briefcase, Gem, GraduationCap, Lightbulb, Settings, Users, Wrench } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Input, Select, Textarea } from "../ui/form";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

type EmploymentType = "employee" | "contractor" | "intern";

// Type for profile with user and manager data (returned from listUserProfiles query)
type UserProfileWithUser = FunctionReturnType<typeof api.userProfiles.listUserProfiles>[number];
type EmploymentTypeConfig = FunctionReturnType<
  typeof api.userProfiles.getEmploymentTypeConfigs
>[number];
type UserWithoutProfile = FunctionReturnType<
  typeof api.userProfiles.getUsersWithoutProfiles
>[number];

// Helper: Convert string to number or undefined
function parseOptionalNumber(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

// Helper: Convert date string to timestamp or undefined
function parseOptionalDate(value: string): number | undefined {
  return value ? new Date(value).getTime() : undefined;
}

// Helper: Build profile data from form state
function buildProfileData(formData: {
  userId: Id<"users">;
  profileType: EmploymentType;
  profileMaxWeekly: string;
  profileMaxDaily: string;
  profileRequiresApproval: boolean | null;
  profileCanOvertime: boolean | null;
  profileDepartment: string;
  profileJobTitle: string;
  profileStartDate: string;
  profileEndDate: string;
  profileHasEquity: boolean;
  profileEquityPercentage: string;
  profileRequiredEquityWeekly: string;
  profileRequiredEquityMonthly: string;
  profileMaxEquityWeekly: string;
  profileEquityHourlyValue: string;
  profileEquityNotes: string;
  profileIsActive: boolean;
}) {
  return {
    userId: formData.userId,
    employmentType: formData.profileType,
    maxHoursPerWeek: parseOptionalNumber(formData.profileMaxWeekly),
    maxHoursPerDay: parseOptionalNumber(formData.profileMaxDaily),
    requiresApproval: formData.profileRequiresApproval ?? undefined,
    canWorkOvertime: formData.profileCanOvertime ?? undefined,
    department: formData.profileDepartment || undefined,
    jobTitle: formData.profileJobTitle || undefined,
    startDate: parseOptionalDate(formData.profileStartDate),
    endDate: parseOptionalDate(formData.profileEndDate),
    hasEquity: formData.profileHasEquity || undefined,
    equityPercentage: parseOptionalNumber(formData.profileEquityPercentage),
    requiredEquityHoursPerWeek: parseOptionalNumber(formData.profileRequiredEquityWeekly),
    requiredEquityHoursPerMonth: parseOptionalNumber(formData.profileRequiredEquityMonthly),
    maxEquityHoursPerWeek: parseOptionalNumber(formData.profileMaxEquityWeekly),
    equityHourlyValue: parseOptionalNumber(formData.profileEquityHourlyValue),
    equityNotes: formData.profileEquityNotes || undefined,
    isActive: formData.profileIsActive,
  };
}

// Helper: Extract form state from profile for editing
function extractFormStateFromProfile(profile: UserProfileWithUser) {
  return {
    profileType: profile.employmentType,
    profileMaxWeekly: profile.maxHoursPerWeek?.toString() || "",
    profileMaxDaily: profile.maxHoursPerDay?.toString() || "",
    profileRequiresApproval: profile.requiresApproval ?? null,
    profileCanOvertime: profile.canWorkOvertime ?? null,
    profileDepartment: profile.department || "",
    profileJobTitle: profile.jobTitle || "",
    profileStartDate: profile.startDate
      ? new Date(profile.startDate).toISOString().split("T")[0]
      : "",
    profileEndDate: profile.endDate ? new Date(profile.endDate).toISOString().split("T")[0] : "",
    profileIsActive: profile.isActive,
    profileHasEquity: profile.hasEquity ?? false,
    profileEquityPercentage: profile.equityPercentage?.toString() || "",
    profileRequiredEquityWeekly: profile.requiredEquityHoursPerWeek?.toString() || "",
    profileRequiredEquityMonthly: profile.requiredEquityHoursPerMonth?.toString() || "",
    profileMaxEquityWeekly: profile.maxEquityHoursPerWeek?.toString() || "",
    profileEquityHourlyValue: profile.equityHourlyValue?.toString() || "",
    profileEquityNotes: profile.equityNotes || "",
  };
}

export function UserTypeManager() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedType, setSelectedType] = useState<EmploymentType>("employee");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employment type configs
  const configs = useQuery(api.userProfiles.getEmploymentTypeConfigs);
  const updateConfig = useMutation(api.userProfiles.updateEmploymentTypeConfig);
  const initConfigs = useMutation(api.userProfiles.initializeEmploymentTypes);

  // User profiles
  const profiles = useQuery(api.userProfiles.listUserProfiles, {});
  const usersWithoutProfiles = useQuery(api.userProfiles.getUsersWithoutProfiles);
  const upsertProfile = useMutation(api.userProfiles.upsertUserProfile);
  const deleteProfile = useMutation(api.userProfiles.deleteUserProfile);

  // Config form state
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [configMaxWeekly, setConfigMaxWeekly] = useState(40);
  const [configMaxDaily, setConfigMaxDaily] = useState(8);
  const [configRequiresApproval, setConfigRequiresApproval] = useState(false);
  const [configCanOvertime, setConfigCanOvertime] = useState(true);
  const [configCanBilling, setConfigCanBilling] = useState(true);
  const [configCanManageProjects, setConfigCanManageProjects] = useState(true);

  // User profile form state
  const [profileType, setProfileType] = useState<EmploymentType>("employee");
  const [profileMaxWeekly, setProfileMaxWeekly] = useState<string>("");
  const [profileMaxDaily, setProfileMaxDaily] = useState<string>("");
  const [profileRequiresApproval, setProfileRequiresApproval] = useState<boolean | null>(null);
  const [profileCanOvertime, setProfileCanOvertime] = useState<boolean | null>(null);
  const [profileDepartment, setProfileDepartment] = useState("");
  const [profileJobTitle, setProfileJobTitle] = useState("");
  const [profileStartDate, setProfileStartDate] = useState("");
  const [profileEndDate, setProfileEndDate] = useState("");
  const [profileIsActive, setProfileIsActive] = useState(true);
  // Equity state
  const [profileHasEquity, setProfileHasEquity] = useState(false);
  const [profileEquityPercentage, setProfileEquityPercentage] = useState<string>("");
  const [profileRequiredEquityWeekly, setProfileRequiredEquityWeekly] = useState<string>("");
  const [profileRequiredEquityMonthly, setProfileRequiredEquityMonthly] = useState<string>("");
  const [profileMaxEquityWeekly, setProfileMaxEquityWeekly] = useState<string>("");
  const [profileEquityHourlyValue, setProfileEquityHourlyValue] = useState<string>("");
  const [profileEquityNotes, setProfileEquityNotes] = useState("");

  const handleInitializeConfigs = async () => {
    try {
      await initConfigs({});
      showSuccess("Employment type configurations initialized");
    } catch (error) {
      showError(error, "Failed to initialize configurations");
    }
  };

  const handleEditConfig = (type: EmploymentType) => {
    const config = configs?.find((c: EmploymentTypeConfig) => c.type === type);
    if (!config) return;

    setSelectedType(type);
    setConfigName(config.name);
    setConfigDescription(config.description || "");
    setConfigMaxWeekly(config.defaultMaxHoursPerWeek);
    setConfigMaxDaily(config.defaultMaxHoursPerDay);
    setConfigRequiresApproval(config.defaultRequiresApproval);
    setConfigCanOvertime(config.defaultCanWorkOvertime);
    setConfigCanBilling(config.canAccessBilling);
    setConfigCanManageProjects(config.canManageProjects);
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateConfig({
        type: selectedType,
        name: configName,
        description: configDescription || undefined,
        defaultMaxHoursPerWeek: configMaxWeekly,
        defaultMaxHoursPerDay: configMaxDaily,
        defaultRequiresApproval: configRequiresApproval,
        defaultCanWorkOvertime: configCanOvertime,
        canAccessBilling: configCanBilling,
        canManageProjects: configCanManageProjects,
      });
      showSuccess("Configuration updated");
      setShowConfigModal(false);
    } catch (error) {
      showError(error, "Failed to update configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignUser = (userId: Id<"users">) => {
    setSelectedUserId(userId);
    setProfileType("employee");
    setProfileMaxWeekly("");
    setProfileMaxDaily("");
    setProfileRequiresApproval(null);
    setProfileCanOvertime(null);
    setProfileDepartment("");
    setProfileJobTitle("");
    setProfileStartDate("");
    setProfileEndDate("");
    setProfileIsActive(true);
    setProfileHasEquity(false);
    setProfileEquityPercentage("");
    setProfileRequiredEquityWeekly("");
    setProfileRequiredEquityMonthly("");
    setProfileMaxEquityWeekly("");
    setProfileEquityHourlyValue("");
    setProfileEquityNotes("");
    setShowAssignModal(true);
  };

  const handleEditProfile = (profile: UserProfileWithUser) => {
    setSelectedUserId(profile.userId);
    const formState = extractFormStateFromProfile(profile);
    setProfileType(formState.profileType);
    setProfileMaxWeekly(formState.profileMaxWeekly);
    setProfileMaxDaily(formState.profileMaxDaily);
    setProfileRequiresApproval(formState.profileRequiresApproval);
    setProfileCanOvertime(formState.profileCanOvertime);
    setProfileDepartment(formState.profileDepartment);
    setProfileJobTitle(formState.profileJobTitle);
    setProfileStartDate(formState.profileStartDate);
    setProfileEndDate(formState.profileEndDate);
    setProfileIsActive(formState.profileIsActive);
    setProfileHasEquity(formState.profileHasEquity);
    setProfileEquityPercentage(formState.profileEquityPercentage);
    setProfileRequiredEquityWeekly(formState.profileRequiredEquityWeekly);
    setProfileRequiredEquityMonthly(formState.profileRequiredEquityMonthly);
    setProfileMaxEquityWeekly(formState.profileMaxEquityWeekly);
    setProfileEquityHourlyValue(formState.profileEquityHourlyValue);
    setProfileEquityNotes(formState.profileEquityNotes);
    setShowAssignModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      const profileData = buildProfileData({
        userId: selectedUserId,
        profileType,
        profileMaxWeekly,
        profileMaxDaily,
        profileRequiresApproval,
        profileCanOvertime,
        profileDepartment,
        profileJobTitle,
        profileStartDate,
        profileEndDate,
        profileHasEquity,
        profileEquityPercentage,
        profileRequiredEquityWeekly,
        profileRequiredEquityMonthly,
        profileMaxEquityWeekly,
        profileEquityHourlyValue,
        profileEquityNotes,
        profileIsActive,
      });

      await upsertProfile({
        ...profileData,
        hasEquity: profileData.hasEquity ?? false,
      });
      showSuccess("User profile saved");
      setShowAssignModal(false);
      setSelectedUserId(null);
    } catch (error) {
      showError(error, "Failed to save user profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async (userId: Id<"users">) => {
    if (!confirm("Remove employment type assignment for this user?")) return;

    try {
      await deleteProfile({ userId });
      showSuccess("User profile removed");
    } catch (error) {
      showError(error, "Failed to remove user profile");
    }
  };

  const getTypeIcon = (type: EmploymentType, size = "w-5 h-5") => {
    switch (type) {
      case "employee":
        return <Briefcase className={size} />;
      case "contractor":
        return <Wrench className={size} />;
      case "intern":
        return <GraduationCap className={size} />;
    }
  };

  const getTypeColor = (type: EmploymentType) => {
    switch (type) {
      case "employee":
        return "bg-brand-subtle text-brand-hover";
      case "contractor":
        return "bg-accent-subtle text-accent-hover";
      case "intern":
        return "bg-status-success-bg text-status-success-text";
    }
  };

  return (
    <Flex direction="column" gap="xl">
      {/* Employment Type Configurations */}
      <Card>
        <CardHeader
          title="Employment Type Configurations"
          description="Default settings for each employment type"
          action={
            !configs || configs.length === 0 ? (
              <Button onClick={handleInitializeConfigs}>Initialize Defaults</Button>
            ) : undefined
          }
        />
        <CardBody>
          {!configs ? (
            <Typography variant="small" color="tertiary" className="text-center py-8">
              Loading...
            </Typography>
          ) : configs.length === 0 ? (
            <EmptyState
              icon={Settings}
              title="No configurations"
              description="Initialize default employment type configurations"
              action={{
                label: "Initialize Now",
                onClick: handleInitializeConfigs,
              }}
            />
          ) : (
            <Grid cols={1} colsMd={3} gap="lg">
              {configs.map((config: EmploymentTypeConfig) => (
                <Card
                  key={config.type}
                  padding="md"
                  className="transition-default hover:bg-ui-bg-hover"
                >
                  <Stack gap="sm">
                    <Flex justify="between" align="start">
                      <Flex align="center" gap="sm">
                        {getTypeIcon(config.type, "w-7 h-7")}
                        <Stack gap="xs">
                          <Typography variant="label">{config.name}</Typography>
                          <Badge size="sm" className={cn("capitalize", getTypeColor(config.type))}>
                            {config.type}
                          </Badge>
                        </Stack>
                      </Flex>
                    </Flex>

                    {config.description && (
                      <Typography variant="small" color="secondary">
                        {config.description}
                      </Typography>
                    )}

                    <Stack gap="xs">
                      <Flex justify="between">
                        <Typography variant="small" color="secondary">
                          Max hours/week:
                        </Typography>
                        <Typography variant="label">{config.defaultMaxHoursPerWeek}h</Typography>
                      </Flex>
                      <Flex justify="between">
                        <Typography variant="small" color="secondary">
                          Max hours/day:
                        </Typography>
                        <Typography variant="label">{config.defaultMaxHoursPerDay}h</Typography>
                      </Flex>
                      <Flex justify="between">
                        <Typography variant="small" color="secondary">
                          Requires approval:
                        </Typography>
                        <Typography variant="label">
                          {config.defaultRequiresApproval ? "Yes" : "No"}
                        </Typography>
                      </Flex>
                      <Flex justify="between">
                        <Typography variant="small" color="secondary">
                          Can work overtime:
                        </Typography>
                        <Typography variant="label">
                          {config.defaultCanWorkOvertime ? "Yes" : "No"}
                        </Typography>
                      </Flex>
                    </Stack>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEditConfig(config.type)}
                      className="w-full"
                    >
                      Edit Configuration
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Grid>
          )}
        </CardBody>
      </Card>

      {/* User Assignments */}
      <Card>
        <CardHeader
          title="User Employment Assignments"
          description="Assign employment types to users"
        />
        <CardBody>
          {/* Users without profiles */}
          {usersWithoutProfiles && usersWithoutProfiles.length > 0 && (
            <Card padding="md" className="mb-6 bg-status-warning-bg border-status-warning">
              <Stack gap="sm">
                <Typography variant="label" className="text-status-warning-text">
                  Unassigned Users ({usersWithoutProfiles.length})
                </Typography>
                <Stack gap="sm">
                  {usersWithoutProfiles.slice(0, 5).map((user: UserWithoutProfile) => (
                    <Flex
                      key={user._id}
                      justify="between"
                      align="center"
                      className="bg-ui-bg p-2 rounded transition-default hover:bg-ui-bg-hover"
                    >
                      <Typography variant="small">
                        {user.name || user.email || "Unknown User"}
                      </Typography>
                      <Button size="sm" onClick={() => handleAssignUser(user._id)}>
                        Assign Type
                      </Button>
                    </Flex>
                  ))}
                  {usersWithoutProfiles.length > 5 && (
                    <Typography variant="caption">
                      +{usersWithoutProfiles.length - 5} more...
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </Card>
          )}

          {/* Assigned users */}
          {!profiles ? (
            <Typography variant="small" color="tertiary" className="text-center py-8">
              Loading...
            </Typography>
          ) : profiles.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No user assignments"
              description="Assign employment types to users to get started"
            />
          ) : (
            <Stack gap="sm">
              {profiles.map((profile: UserProfileWithUser) => (
                <Card
                  key={profile._id}
                  padding="md"
                  className="transition-default hover:bg-ui-bg-hover"
                >
                  <Flex justify="between" align="start">
                    <FlexItem flex="1">
                      <Stack gap="sm">
                        <Flex gap="md" align="center">
                          {getTypeIcon(profile.employmentType, "w-5 h-5")}
                          <Stack gap="xs">
                            <Typography variant="label">
                              {profile.user?.name || profile.user?.email || "Unknown User"}
                            </Typography>
                            <Flex gap="sm">
                              <Badge
                                size="sm"
                                className={cn("capitalize", getTypeColor(profile.employmentType))}
                              >
                                {profile.employmentType}
                              </Badge>
                              {!profile.isActive && (
                                <Badge variant="error" size="sm">
                                  Inactive
                                </Badge>
                              )}
                            </Flex>
                          </Stack>
                        </Flex>

                        <Grid cols={2} colsMd={4} gap="md">
                          {profile.jobTitle && (
                            <Stack gap="none">
                              <Typography variant="caption" color="tertiary">
                                Job Title:
                              </Typography>
                              <Typography variant="label">{profile.jobTitle}</Typography>
                            </Stack>
                          )}
                          {profile.department && (
                            <Stack gap="none">
                              <Typography variant="caption" color="tertiary">
                                Department:
                              </Typography>
                              <Typography variant="label">{profile.department}</Typography>
                            </Stack>
                          )}
                          <Stack gap="none">
                            <Typography variant="caption" color="tertiary">
                              Max hours/week:
                            </Typography>
                            <Typography variant="label">
                              {profile.maxHoursPerWeek || "Default"}
                            </Typography>
                          </Stack>
                          <Stack gap="none">
                            <Typography variant="caption" color="tertiary">
                              Max hours/day:
                            </Typography>
                            <Typography variant="label">
                              {profile.maxHoursPerDay || "Default"}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Stack>
                    </FlexItem>

                    <Flex gap="sm" className="ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleEditProfile({
                            ...profile,
                            user: profile.user || null,
                            manager: null,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProfile(profile.userId)}
                      >
                        Remove
                      </Button>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}
        </CardBody>
      </Card>

      {/* Edit Config Modal */}
      <Dialog
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        title={`Edit ${selectedType} Configuration`}
        className="sm:max-w-2xl"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowConfigModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="config-form" isLoading={isSubmitting}>
              Save Configuration
            </Button>
          </>
        }
      >
        <form id="config-form" onSubmit={handleSaveConfig}>
          <Flex direction="column" gap="lg">
            <Input
              label="Display Name"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              required
            />

            <Input
              label="Description"
              value={configDescription}
              onChange={(e) => setConfigDescription(e.target.value)}
            />

            <Grid cols={2} gap="lg">
              <Input
                label="Max Hours per Week"
                type="number"
                value={configMaxWeekly}
                onChange={(e) => setConfigMaxWeekly(Number(e.target.value))}
                min={1}
                max={168}
                required
              />

              <Input
                label="Max Hours per Day"
                type="number"
                value={configMaxDaily}
                onChange={(e) => setConfigMaxDaily(Number(e.target.value))}
                min={1}
                max={24}
                required
              />
            </Grid>

            <Flex direction="column" gap="md">
              <label>
                <Flex align="center" gap="sm">
                  <input
                    type="checkbox"
                    checked={configRequiresApproval}
                    onChange={(e) => setConfigRequiresApproval(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Typography variant="small">
                    Requires manager approval for time entries
                  </Typography>
                </Flex>
              </label>

              <label>
                <Flex align="center" gap="sm">
                  <input
                    type="checkbox"
                    checked={configCanOvertime}
                    onChange={(e) => setConfigCanOvertime(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Typography variant="small">Can work overtime hours</Typography>
                </Flex>
              </label>

              <label>
                <Flex align="center" gap="sm">
                  <input
                    type="checkbox"
                    checked={configCanBilling}
                    onChange={(e) => setConfigCanBilling(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Typography variant="small">Can access billing information</Typography>
                </Flex>
              </label>

              <label>
                <Flex align="center" gap="sm">
                  <input
                    type="checkbox"
                    checked={configCanManageProjects}
                    onChange={(e) => setConfigCanManageProjects(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Typography variant="small">Can manage projects</Typography>
                </Flex>
              </label>
            </Flex>
          </Flex>
        </form>
      </Dialog>

      {/* Assign/Edit User Modal */}
      <Dialog
        open={showAssignModal}
        onOpenChange={(open) => {
          setShowAssignModal(open);
          if (!open) {
            setSelectedUserId(null);
          }
        }}
        title={selectedUserId ? "Edit User Employment" : "Assign Employment Type"}
        className="sm:max-w-2xl"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedUserId(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" form="profile-form" isLoading={isSubmitting}>
              Save Profile
            </Button>
          </>
        }
      >
        <form id="profile-form" onSubmit={handleSaveProfile}>
          <Flex direction="column" gap="lg">
            <Select
              label="Employment Type"
              value={profileType}
              onChange={(e) => setProfileType(e.target.value as EmploymentType)}
              required
            >
              <option value="employee">Employee</option>
              <option value="contractor">Contractor</option>
              <option value="intern">Intern</option>
            </Select>

            <Grid cols={2} gap="lg">
              <Input
                label="Job Title"
                value={profileJobTitle}
                onChange={(e) => setProfileJobTitle(e.target.value)}
                placeholder="e.g., Senior Developer"
              />

              <Input
                label="Department"
                value={profileDepartment}
                onChange={(e) => setProfileDepartment(e.target.value)}
                placeholder="e.g., Engineering"
              />
            </Grid>

            <Card padding="md" className="bg-ui-bg-secondary">
              <Stack gap="sm">
                <Typography variant="label">
                  Hour Overrides (leave empty to use type defaults)
                </Typography>
                <Grid cols={2} gap="lg">
                  <Input
                    label="Max Hours per Week"
                    type="number"
                    value={profileMaxWeekly}
                    onChange={(e) => setProfileMaxWeekly(e.target.value)}
                    placeholder="Default"
                    min={1}
                    max={168}
                  />

                  <Input
                    label="Max Hours per Day"
                    type="number"
                    value={profileMaxDaily}
                    onChange={(e) => setProfileMaxDaily(e.target.value)}
                    placeholder="Default"
                    min={1}
                    max={24}
                  />
                </Grid>
              </Stack>
            </Card>

            <Grid cols={2} gap="lg">
              <Input
                label="Start Date"
                type="date"
                value={profileStartDate}
                onChange={(e) => setProfileStartDate(e.target.value)}
              />

              <Input
                label="End Date (Optional)"
                type="date"
                value={profileEndDate}
                onChange={(e) => setProfileEndDate(e.target.value)}
              />
            </Grid>

            {/* Equity Compensation Section (Employees Only) */}
            {profileType === "employee" && (
              <Card padding="md" className="bg-brand-subtle border-brand-border">
                <Stack gap="sm">
                  <Flex justify="between" align="center">
                    <Flex align="center" gap="xs">
                      <Icon icon={Gem} size="sm" className="text-brand-active" />
                      <Typography variant="label" className="text-brand-active">
                        Equity Compensation
                      </Typography>
                    </Flex>
                    <label>
                      <Flex align="center" gap="sm">
                        <input
                          type="checkbox"
                          checked={profileHasEquity}
                          onChange={(e) => setProfileHasEquity(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Typography variant="caption" className="font-medium text-brand-active">
                          Has Equity
                        </Typography>
                      </Flex>
                    </label>
                  </Flex>

                  {profileHasEquity && (
                    <Stack gap="lg">
                      <Grid cols={2} gap="lg">
                        <Input
                          label="Equity Percentage (%)"
                          type="number"
                          value={profileEquityPercentage}
                          onChange={(e) => setProfileEquityPercentage(e.target.value)}
                          placeholder="e.g., 0.5 for 0.5%"
                          step="0.001"
                          min={0}
                        />

                        <Input
                          label="Equity Hour Value ($)"
                          type="number"
                          value={profileEquityHourlyValue}
                          onChange={(e) => setProfileEquityHourlyValue(e.target.value)}
                          placeholder="Est. value per hour"
                          step="0.01"
                          min={0}
                        />
                      </Grid>

                      <Grid cols={3} gap="lg">
                        <Input
                          label="Required Hours/Week"
                          type="number"
                          value={profileRequiredEquityWeekly}
                          onChange={(e) => setProfileRequiredEquityWeekly(e.target.value)}
                          placeholder="e.g., 10"
                          min={0}
                          max={168}
                        />

                        <Input
                          label="Required Hours/Month"
                          type="number"
                          value={profileRequiredEquityMonthly}
                          onChange={(e) => setProfileRequiredEquityMonthly(e.target.value)}
                          placeholder="e.g., 40"
                          min={0}
                        />

                        <Input
                          label="Max Equity Hours/Week"
                          type="number"
                          value={profileMaxEquityWeekly}
                          onChange={(e) => setProfileMaxEquityWeekly(e.target.value)}
                          placeholder="e.g., 20"
                          min={0}
                          max={168}
                        />
                      </Grid>

                      <Textarea
                        label="Equity Notes"
                        value={profileEquityNotes}
                        onChange={(e) => setProfileEquityNotes(e.target.value)}
                        placeholder="Additional notes about equity arrangement..."
                        rows={2}
                      />

                      <Card padding="sm" className="bg-brand-subtle">
                        <Flex align="start" gap="sm" className="text-xs text-brand-hover">
                          <Icon icon={Lightbulb} size="sm" className="shrink-0 mt-0.5" />
                          <span>
                            Tip: Equity hours are non-paid hours compensated with equity. Set
                            required hours/week OR hours/month (not both). Max hours/week prevents
                            overwork.
                          </span>
                        </Flex>
                      </Card>
                    </Stack>
                  )}
                </Stack>
              </Card>
            )}

            <Flex direction="column" gap="md">
              <label>
                <Flex align="center" gap="sm">
                  <input
                    type="checkbox"
                    checked={profileIsActive}
                    onChange={(e) => setProfileIsActive(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Typography variant="small" className="font-medium">
                    Active Employment
                  </Typography>
                </Flex>
              </label>
            </Flex>
          </Flex>
        </form>
      </Dialog>
    </Flex>
  );
}
