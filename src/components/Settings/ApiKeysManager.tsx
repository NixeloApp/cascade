import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, BookOpen, Copy, Key, Plus, Trash2, TrendingUp } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog } from "../ui/Dialog";
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
  const apiKeys = useQuery(api.apiKeys.list);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<Id<"apiKeys"> | null>(null);

  return (
    <Card padding="lg">
      <Stack gap="lg">
        {/* Header */}
        <Flex justify="between" align="center">
          <Stack gap="xs">
            <Typography variant="h3">
              <Flex gap="sm" align="center">
                <Key className="h-5 w-5" />
                API Keys
              </Flex>
            </Typography>
            <Typography variant="small" color="secondary">
              Generate API keys for CLI tools, AI agents, and external integrations
            </Typography>
          </Stack>
          <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
            <Flex gap="sm" align="center">
              <Plus className="h-4 w-4" />
              Generate Key
            </Flex>
          </Button>
        </Flex>

        {/* API Keys List */}
        {!apiKeys || apiKeys.length === 0 ? (
          <Card
            padding="lg"
            className="text-center bg-ui-bg-secondary border-2 border-dashed border-ui-border"
          >
            <Stack gap="sm" align="center">
              <Key className="h-12 w-12 text-ui-text-tertiary" />
              <Typography variant="label">No API keys yet</Typography>
              <Typography variant="small" color="secondary">
                Generate your first API key to access Nixelo programmatically
              </Typography>
              <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
                <Flex gap="sm" align="center">
                  <Plus className="h-4 w-4" />
                  Generate Your First Key
                </Flex>
              </Button>
            </Stack>
          </Card>
        ) : (
          <Stack gap="lg">
            {apiKeys.map((key) => (
              <ApiKeyCard key={key.id} apiKey={key} onViewStats={() => setSelectedKeyId(key.id)} />
            ))}
          </Stack>
        )}

        {/* Documentation Link */}
        <Card padding="md" className="bg-brand-subtle border-brand-border">
          <Flex align="center" gap="sm">
            <Icon icon={BookOpen} size="sm" className="text-brand-active" />
            <Typography variant="small" className="text-brand-active">
              <strong>Need help?</strong> Check out the{" "}
              <a
                href="/docs/API.md"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-brand-hover"
              >
                API Documentation
              </a>{" "}
              for usage examples and integration guides.
            </Typography>
          </Flex>
        </Card>
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
  const revokeKey = useMutation(api.apiKeys.revoke);
  const deleteKey = useMutation(api.apiKeys.remove);
  const [isRevoking, setIsRevoking] = useState(false);
  const [_isDeleting, setIsDeleting] = useState(false);

  const handleRevoke = async () => {
    if (!confirm(`Revoke API key "${apiKey.name}"? This will immediately stop it from working.`)) {
      return;
    }

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

  const handleDelete = async () => {
    if (!confirm(`Permanently delete API key "${apiKey.name}"? This cannot be undone.`)) {
      return;
    }

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
    toast.success("Key prefix copied to clipboard");
  };

  return (
    <Card padding="md" className="bg-ui-bg-secondary">
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
                <Button
                  onClick={copyKeyPrefix}
                  variant="ghost"
                  size="sm"
                  className="p-1 min-w-0"
                  aria-label="Copy key prefix"
                >
                  <Copy className="h-4 w-4" />
                </Button>
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
                <strong>{apiKey.usageCount}</strong> API calls
              </MetadataItem>
              <MetadataItem>
                <strong>{apiKey.rateLimit}</strong> req/min
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
              <TrendingUp className="h-4 w-4" />
            </IconButton>
          </Tooltip>
          {apiKey.isActive && (
            <Button
              onClick={handleRevoke}
              variant="ghost"
              size="sm"
              isLoading={isRevoking}
              className="text-status-warning hover:bg-status-warning-bg"
              aria-label="Revoke key"
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </Button>
          )}
          <Tooltip content="Delete API key">
            <IconButton onClick={handleDelete} variant="danger" size="sm" aria-label="Delete key">
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
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
  const generateKey = useMutation(api.apiKeys.generate);
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
                    <Card padding="sm" hoverable className="bg-ui-bg-secondary">
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
            <Flex justify="end" gap="sm" className="pt-4 border-t border-ui-border">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate API Key"}
              </Button>
            </Flex>
          </>
        ) : (
          <>
            {/* Success - Show Generated Key */}
            <Stack gap="lg" align="center" className="text-center">
              <Flex
                justify="center"
                align="center"
                className="h-12 w-12 rounded-full bg-status-success-bg"
              >
                <Key className="h-6 w-6 text-status-success" />
              </Flex>
              <Stack gap="sm" align="center">
                <Typography variant="h3">API Key Generated!</Typography>
                <Typography variant="small" color="secondary">
                  <Icon icon={AlertTriangle} size="sm" className="inline mr-1" />{" "}
                  <strong>Save this key now!</strong> You won't be able to see it again.
                </Typography>
              </Stack>

              {/* Generated Key Display */}
              <Card padding="md" className="w-full bg-ui-bg-tertiary">
                <Typography
                  variant="inlineCode"
                  className="text-status-success break-all select-all"
                >
                  {generatedKey}
                </Typography>
              </Card>

              {/* Copy Instructions */}
              <Card padding="md" className="w-full text-left bg-status-info-bg">
                <Stack gap="sm">
                  <Typography variant="label" className="text-status-info-text">
                    Usage Example:
                  </Typography>
                  <Typography variant="inlineCode" className="block bg-ui-bg p-2 rounded text-xs">
                    curl -H "Authorization: Bearer {generatedKey.substring(0, 20)}..."
                    https://nixelo.app/api/issues
                  </Typography>
                </Stack>
              </Card>

              {/* Actions */}
              <Flex justify="end" gap="sm" className="w-full pt-4 border-t border-ui-border">
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  I've Saved It
                </Button>
                <Button variant="primary" onClick={copyAndClose} className="flex-1">
                  <Flex justify="center" gap="sm" align="center">
                    <Copy className="h-4 w-4" />
                    Copy & Close
                  </Flex>
                </Button>
              </Flex>
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
  const stats = useQuery(api.apiKeys.getUsageStats, keyId ? { keyId } : "skip");

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
        <Stack gap="sm" align="center" className="min-h-32 justify-center">
          <LoadingSpinner size="lg" />
          <Typography variant="small" color="tertiary">
            Loading statistics...
          </Typography>
        </Stack>
      ) : (
        <Stack gap="lg">
          {/* Overview Stats */}
          <Grid cols={2} colsSm={4} gap="lg">
            <Card padding="md" className="bg-ui-bg-secondary">
              <Stack gap="xs">
                <Typography variant="caption">Total Calls</Typography>
                <Typography variant="h3">{stats.totalCalls.toLocaleString()}</Typography>
              </Stack>
            </Card>
            <Card padding="md" className="bg-ui-bg-secondary">
              <Stack gap="xs">
                <Typography variant="caption">Last 24 Hours</Typography>
                <Typography variant="h3">{stats.last24Hours.toLocaleString()}</Typography>
              </Stack>
            </Card>
            <Card padding="md" className="bg-ui-bg-secondary">
              <Stack gap="xs">
                <Typography variant="caption">Success Rate</Typography>
                <Typography variant="h3" className="text-status-success">
                  {stats.last24Hours > 0
                    ? Math.round((stats.successCount / stats.last24Hours) * 100)
                    : 100}
                  %
                </Typography>
              </Stack>
            </Card>
            <Card padding="md" className="bg-ui-bg-secondary">
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
              <Typography variant="small" color="tertiary" className="py-4 text-center">
                No recent requests
              </Typography>
            ) : (
              <Stack gap="sm" className="max-h-64 overflow-y-auto">
                {stats.recentLogs.map((log: UsageLog) => (
                  <Card
                    padding="sm"
                    key={`${log.endpoint}-${log.createdAt}`}
                    className="bg-ui-bg-secondary"
                  >
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
