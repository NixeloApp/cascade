/**
 * API Keys Manager
 *
 * UI for managing project API keys with create, rotate, and revoke operations.
 * Displays key metadata, usage statistics, and expiration status.
 * Supports scoped permissions and rate limit configuration.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { Copy, Key, Plus, Trash2, TrendingUp } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { showError, showSuccess } from "@/lib/toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/Alert";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardHeader } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { EmptyState } from "../ui/EmptyState";
import { Flex, FlexItem } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { Grid } from "../ui/Grid";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { Label } from "../ui/Label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Metadata, MetadataItem, MetadataTimestamp } from "../ui/Metadata";
import { Stack } from "../ui/Stack";
import { Tooltip } from "../ui/Tooltip";
import { Typography } from "../ui/Typography";

/**
 * API Key Type (inferred from backend)
 */
type ApiKey = FunctionReturnType<typeof api.apiKeys.list>[number];

/**
 * API Usage Log Type (inferred from backend)
 */
type UsageLog = FunctionReturnType<typeof api.apiKeys.getUsageStats>["recentLogs"][number];

/**
 * API Keys Manager
 *
 * Allows users to generate and manage API keys for CLI/AI integration
 */
export function ApiKeysManager() {
  const apiKeys = useAuthenticatedQuery(api.apiKeys.list, {});
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<Id<"apiKeys"> | null>(null);

  return (
    <Card padding="lg" data-testid={TEST_IDS.SETTINGS.API_KEYS_SECTION}>
      <Stack gap="lg">
        <CardHeader
          action={
            <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
              <Flex gap="sm" align="center">
                <Icon icon={Plus} size="sm" />
                Generate Key
              </Flex>
            </Button>
          }
          title={
            <Flex gap="sm" align="center">
              <Icon icon={Key} />
              <span>API Keys</span>
            </Flex>
          }
          description="Generate API keys for CLI tools, AI agents, and external integrations"
        />

        {/* API Keys List */}
        {!apiKeys || apiKeys.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API keys yet"
            description="Generate your first API key to access Nixelo programmatically."
            action={{
              label: "Generate Your First Key",
              onClick: () => setShowGenerateModal(true),
            }}
            variant="info"
          />
        ) : (
          <Stack gap="lg">
            {apiKeys.map((key) => (
              <ApiKeyCard key={key.id} apiKey={key} onViewStats={() => setSelectedKeyId(key.id)} />
            ))}
          </Stack>
        )}

        {/* Documentation Link */}
        <Alert variant="info">
          <AlertTitle>Need help?</AlertTitle>
          <AlertDescription>
            Check out the{" "}
            <Button asChild variant="link" size="none">
              <a href="/docs/API.md" target="_blank" rel="noopener noreferrer">
                API Documentation
              </a>
            </Button>{" "}
            for usage examples and integration guides.
          </AlertDescription>
        </Alert>
      </Stack>

      {/* Generate Key Modal */}
      <GenerateKeyModal open={showGenerateModal} onOpenChange={setShowGenerateModal} />

      {/* Usage Stats Modal */}
      <UsageStatsModal
        open={selectedKeyId !== null}
        onOpenChange={(open) => !open && setSelectedKeyId(null)}
        keyId={selectedKeyId}
      />
    </Card>
  );
}

/**
 * Individual API Key Card
 */
function ApiKeyCard({ apiKey, onViewStats }: { apiKey: ApiKey; onViewStats: () => void }) {
  const { mutate: revokeKey } = useAuthenticatedMutation(api.apiKeys.revoke);
  const { mutate: deleteKey } = useAuthenticatedMutation(api.apiKeys.remove);
  const [isRevoking, setIsRevoking] = useState(false);
  const [, setIsDeleting] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleRevokeConfirm = async () => {
    setIsRevoking(true);
    try {
      await revokeKey({ keyId: apiKey.id });
      showSuccess("API key revoked successfully");
    } catch (error) {
      showError(error, "Failed to revoke API key");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteKey({ keyId: apiKey.id });
      showSuccess("API key deleted successfully");
    } catch (error) {
      showError(error, "Failed to delete API key");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyKeyPrefix = () => {
    navigator.clipboard.writeText(apiKey.keyPrefix);
    showSuccess("Key prefix copied to clipboard");
  };

  return (
    <Card padding="md" variant="flat">
      <Flex justify="between" align="start">
        <FlexItem flex="1">
          <Stack gap="sm">
            {/* Name & Status */}
            <Flex gap="sm" align="center">
              <Typography variant="label">{apiKey.name}</Typography>
              {apiKey.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="error">Revoked</Badge>
              )}
            </Flex>

            {/* Key Prefix */}
            <Flex gap="sm" align="center">
              <Typography variant="inlineCode">{apiKey.keyPrefix}...</Typography>
              <Tooltip content="Copy key prefix">
                <IconButton
                  onClick={copyKeyPrefix}
                  variant="ghost"
                  size="sm"
                  aria-label="Copy key prefix"
                >
                  <Icon icon={Copy} size="sm" />
                </IconButton>
              </Tooltip>
            </Flex>

            {/* Scopes */}
            <Flex wrap gap="xs">
              {apiKey.scopes.map((scope: string) => (
                <Badge key={scope} variant="brand" size="sm">
                  {scope}
                </Badge>
              ))}
            </Flex>

            {/* Stats */}
            <Metadata size="xs" gap="md">
              <MetadataItem>
                <Typography as="strong" variant="strong">
                  {apiKey.usageCount}
                </Typography>{" "}
                API calls
              </MetadataItem>
              <MetadataItem>
                <Typography as="strong" variant="strong">
                  {apiKey.rateLimit}
                </Typography>{" "}
                req/min
              </MetadataItem>
              {apiKey.lastUsedAt && (
                <MetadataItem>
                  Last used: <MetadataTimestamp date={apiKey.lastUsedAt} format="absolute" />
                </MetadataItem>
              )}
              {apiKey.expiresAt && (
                <MetadataItem
                  className={apiKey.expiresAt < Date.now() ? "text-status-error" : undefined}
                >
                  Expires: <MetadataTimestamp date={apiKey.expiresAt} format="absolute" />
                </MetadataItem>
              )}
            </Metadata>
          </Stack>
        </FlexItem>

        {/* Actions */}
        <Flex gap="sm" align="center" className="ml-4">
          <Tooltip content="View usage statistics">
            <IconButton
              onClick={onViewStats}
              variant="brand"
              size="sm"
              aria-label="View usage statistics"
            >
              <Icon icon={TrendingUp} size="sm" />
            </IconButton>
          </Tooltip>
          {apiKey.isActive && (
            <Button
              onClick={() => setRevokeConfirmOpen(true)}
              variant="secondary"
              size="sm"
              isLoading={isRevoking}
              aria-label="Revoke key"
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </Button>
          )}
          <Tooltip content="Delete API key">
            <IconButton
              onClick={() => setDeleteConfirmOpen(true)}
              variant="danger"
              size="sm"
              aria-label="Delete key"
            >
              <Icon icon={Trash2} size="sm" />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      <ConfirmDialog
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        onConfirm={handleRevokeConfirm}
        title="Revoke API Key"
        message={`Revoke API key "${apiKey.name}"? This will immediately stop it from working.`}
        variant="warning"
        confirmLabel="Revoke"
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete API Key"
        message={`Permanently delete API key "${apiKey.name}"? This cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
      />
    </Card>
  );
}

/**
 * Generate API Key Modal
 */
function GenerateKeyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate: generateKey } = useAuthenticatedMutation(api.apiKeys.generate);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["issues:read"]);
  const [rateLimit, setRateLimit] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const availableScopes = [
    { value: "issues:read", label: "Read Issues", description: "View issues and their details" },
    { value: "issues:write", label: "Write Issues", description: "Create and update issues" },
    { value: "issues:delete", label: "Delete Issues", description: "Delete issues" },
    { value: "projects:read", label: "Read Projects", description: "View project information" },
    { value: "projects:write", label: "Write Projects", description: "Create and update projects" },
    { value: "comments:read", label: "Read Comments", description: "View issue comments" },
    { value: "comments:write", label: "Write Comments", description: "Add comments to issues" },
    { value: "search:read", label: "Search", description: "Search across projects" },
  ];

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const handleGenerate = async () => {
    if (!name.trim()) {
      showError("Please enter a name for this API key");
      return;
    }

    if (selectedScopes.length === 0) {
      showError("Please select at least one scope");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateKey({
        name: name.trim(),
        scopes: selectedScopes,
        rateLimit,
      });

      setGeneratedKey(result.apiKey);
      showSuccess("API key generated successfully!");
    } catch (error) {
      showError(error, "Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAndClose = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      showSuccess("API key copied to clipboard!");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Generate API Key" size="lg">
      <Stack gap="lg">
        {!generatedKey ? (
          <>
            {/* Key Name */}
            <Input
              label="Key Name *"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., CLI Tool, GitHub Actions, Claude Code"
              helperText="A descriptive name to help you identify this key"
            />

            {/* Scopes */}
            <Stack gap="sm">
              <Label required>Permissions (Scopes)</Label>
              <Stack gap="sm" className="max-h-64 overflow-y-auto">
                {availableScopes.map((scope) => (
                  <label
                    key={scope.value}
                    htmlFor={`scope-${scope.value}`}
                    className="cursor-pointer"
                  >
                    <Card padding="sm" variant="flat" hoverable>
                      <Flex align="start" gap="md">
                        <Checkbox
                          id={`scope-${scope.value}`}
                          checked={selectedScopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          className="mt-0.5"
                        />
                        <Stack gap="none">
                          <Typography variant="label">{scope.label}</Typography>
                          <Typography variant="caption">{scope.description}</Typography>
                        </Stack>
                      </Flex>
                    </Card>
                  </label>
                ))}
              </Stack>
            </Stack>

            {/* Rate Limit */}
            <Input
              label="Rate Limit (requests per minute)"
              type="number"
              value={rateLimit.toString()}
              onChange={(e) => setRateLimit(parseInt(e.target.value, 10) || 100)}
              min="10"
              max="1000"
              helperText="Maximum number of API requests allowed per minute (default: 100)"
            />

            {/* Actions */}
            <Card padding="sm" variant="flat">
              <Flex justify="end" gap="sm">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate API Key"}
                </Button>
              </Flex>
            </Card>
          </>
        ) : (
          <>
            {/* Success - Show Generated Key */}
            <Stack gap="lg" align="center" className="text-center">
              <Badge variant="success" shape="pill">
                API Key Ready
              </Badge>
              <Stack gap="sm" align="center">
                <Typography variant="h3">API Key Generated!</Typography>
                <Alert variant="warning" className="w-full text-left">
                  <AlertTitle>Save this key now</AlertTitle>
                  <AlertDescription>
                    You won't be able to see it again after closing this dialog.
                  </AlertDescription>
                </Alert>
              </Stack>

              {/* Generated Key Display */}
              <Card padding="md" variant="flat" className="w-full">
                <Typography variant="inlineCode" color="success" className="break-all select-all">
                  {generatedKey}
                </Typography>
              </Card>

              {/* Copy Instructions */}
              <Alert variant="info" className="w-full text-left">
                <Stack gap="sm">
                  <AlertTitle>Usage Example</AlertTitle>
                  <Card padding="xs" radius="md" variant="ghost">
                    <Typography variant="inlineCode" className="block">
                      curl -H "Authorization: Bearer {generatedKey.substring(0, 20)}..."
                      https://nixelo.app/api/issues
                    </Typography>
                  </Card>
                </Stack>
              </Alert>

              {/* Actions */}
              <Card padding="sm" variant="flat" className="w-full">
                <Flex justify="end" gap="sm">
                  <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    I've Saved It
                  </Button>
                  <Button variant="primary" onClick={copyAndClose}>
                    <Flex justify="center" gap="sm" align="center">
                      <Icon icon={Copy} size="sm" />
                      Copy & Close
                    </Flex>
                  </Button>
                </Flex>
              </Card>
            </Stack>
          </>
        )}
      </Stack>
    </Dialog>
  );
}

/**
 * Usage Statistics Modal
 */
function UsageStatsModal({
  open,
  onOpenChange,
  keyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: Id<"apiKeys"> | null;
}) {
  const stats = useAuthenticatedQuery(api.apiKeys.getUsageStats, keyId ? { keyId } : "skip");

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="API Key Usage Statistics"
      size="lg"
      footer={
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      {!stats ? (
        <Card padding="lg" variant="flat">
          <Flex direction="column" gap="sm" align="center" justify="center" className="min-h-32">
            <LoadingSpinner size="lg" />
            <Typography variant="small" color="tertiary">
              Loading statistics...
            </Typography>
          </Flex>
        </Card>
      ) : (
        <Stack gap="lg">
          {/* Overview Stats */}
          <Grid cols={2} colsSm={4} gap="lg">
            <Card padding="md" variant="flat">
              <Stack gap="xs">
                <Typography variant="caption">Total Calls</Typography>
                <Typography variant="h3">{stats.totalCalls.toLocaleString()}</Typography>
              </Stack>
            </Card>
            <Card padding="md" variant="flat">
              <Stack gap="xs">
                <Typography variant="caption">Last 24 Hours</Typography>
                <Typography variant="h3">{stats.last24Hours.toLocaleString()}</Typography>
              </Stack>
            </Card>
            <Card padding="md" variant="flat">
              <Stack gap="xs">
                <Typography variant="caption">Success Rate</Typography>
                <Typography variant="h3" color="success">
                  {stats.last24Hours > 0
                    ? Math.round((stats.successCount / stats.last24Hours) * 100)
                    : 100}
                  %
                </Typography>
              </Stack>
            </Card>
            <Card padding="md" variant="flat">
              <Stack gap="xs">
                <Typography variant="caption">Avg Response</Typography>
                <Typography variant="h3">{stats.avgResponseTime}ms</Typography>
              </Stack>
            </Card>
          </Grid>

          {/* Recent Requests */}
          <Stack gap="sm">
            <Typography variant="label">Recent Requests</Typography>
            {stats.recentLogs.length === 0 ? (
              <Card padding="md" variant="flat">
                <Flex justify="center">
                  <Typography variant="small" color="tertiary">
                    No recent requests
                  </Typography>
                </Flex>
              </Card>
            ) : (
              <Stack gap="sm" className="max-h-64 overflow-y-auto">
                {stats.recentLogs.map((log: UsageLog) => (
                  <Card padding="sm" key={`${log.endpoint}-${log.createdAt}`} variant="flat">
                    <Stack gap="xs">
                      <Flex justify="between" align="center">
                        <Flex gap="sm" align="center">
                          <Typography variant="mono">{log.method}</Typography>
                          <Typography variant="small" color="secondary">
                            {log.endpoint}
                          </Typography>
                        </Flex>
                        <Badge size="sm" variant={log.statusCode < 400 ? "success" : "error"}>
                          {log.statusCode}
                        </Badge>
                      </Flex>
                      <Metadata size="xs" gap="md">
                        <MetadataItem>{log.responseTime}ms</MetadataItem>
                        <MetadataTimestamp date={log.createdAt} format="absolute" />
                        {log.error && (
                          <MetadataItem className="text-status-error">{log.error}</MetadataItem>
                        )}
                      </Metadata>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
    </Dialog>
  );
}
