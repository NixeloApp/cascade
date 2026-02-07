import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2, TrendingUp } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/Dialog";
import { Flex } from "../ui/Flex";
import { Checkbox } from "../ui/form/Checkbox";
import { Input } from "../ui/form/Input";
import { Label } from "../ui/Label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Metadata, MetadataItem, MetadataTimestamp } from "../ui/Metadata";
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
    <Card>
      <div className="p-6">
        {/* Header */}
        <Flex justify="between" align="center" className="mb-6">
          <div>
            <Typography variant="h3" className="text-lg font-semibold text-ui-text">
              <Flex gap="sm" align="center">
                <Key className="h-5 w-5" />
                API Keys
              </Flex>
            </Typography>
            <Typography className="text-sm text-ui-text-secondary mt-1">
              Generate API keys for CLI tools, AI agents, and external integrations
            </Typography>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
            <Flex gap="sm" align="center">
              <Plus className="h-4 w-4" />
              Generate Key
            </Flex>
          </Button>
        </Flex>

        {/* API Keys List */}
        {!apiKeys || apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-ui-bg-secondary rounded-lg border-2 border-dashed border-ui-border">
            <Key className="h-12 w-12 text-ui-text-tertiary mx-auto mb-3" />
            <Typography variant="h4" className="text-sm font-medium text-ui-text mb-1">
              No API keys yet
            </Typography>
            <Typography className="text-sm text-ui-text-secondary mb-4">
              Generate your first API key to access Nixelo programmatically
            </Typography>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowGenerateModal(true)}
              className="mx-auto"
            >
              <Flex gap="sm" align="center">
                <Plus className="h-4 w-4" />
                Generate Your First Key
              </Flex>
            </Button>
          </div>
        ) : (
          <Flex direction="column" gap="lg">
            {apiKeys.map((key) => (
              <ApiKeyCard key={key.id} apiKey={key} onViewStats={() => setSelectedKeyId(key.id)} />
            ))}
          </Flex>
        )}

        {/* Documentation Link */}
        <div className="mt-6 p-4 bg-brand-subtle rounded-lg border border-brand-border">
          <Typography className="text-sm text-brand-active">
            📚 <strong>Need help?</strong> Check out the{" "}
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
        </div>
      </div>

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
  const [isDeleting, setIsDeleting] = useState(false);

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
    <div className="p-4 bg-ui-bg-secondary rounded-lg border border-ui-border">
      <Flex justify="between" align="start">
        <div className="flex-1">
          {/* Name & Status */}
          <Flex gap="sm" align="center" className="mb-2">
            <Typography variant="h4" className="font-medium text-ui-text">
              {apiKey.name}
            </Typography>
            {apiKey.isActive ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="error">Revoked</Badge>
            )}
          </Flex>

          {/* Key Prefix */}
          <Flex gap="sm" align="center" className="mb-3">
            <code className="text-sm font-mono bg-ui-bg px-2 py-1 rounded border border-ui-border">
              {apiKey.keyPrefix}...
            </code>
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
          <Flex className="flex-wrap gap-1 mb-3">
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
        </div>

        {/* Actions */}
        <Flex gap="sm" align="center" className="ml-4">
          <Tooltip content="View usage statistics">
            <Button
              onClick={onViewStats}
              variant="ghost"
              size="sm"
              className="p-2 min-w-0 text-ui-text-tertiary hover:text-brand:text-brand-muted"
              aria-label="View usage statistics"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
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
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              isLoading={isDeleting}
              className="p-2 min-w-0 text-ui-text-tertiary hover:text-status-error:text-status-error"
              aria-label="Delete key"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </div>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
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
              <div>
                <Label required className="block mb-2">
                  Permissions (Scopes)
                </Label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableScopes.map((scope) => (
                    <label
                      key={scope.value}
                      htmlFor={`scope-${scope.value}`}
                      className="flex items-start p-3 bg-ui-bg-secondary rounded-lg cursor-pointer hover:bg-ui-bg-tertiary"
                    >
                      <Checkbox
                        id={`scope-${scope.value}`}
                        checked={selectedScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="mt-0.5"
                      />
                      <div className="ml-3">
                        <Typography className="text-sm font-medium text-ui-text">
                          {scope.label}
                        </Typography>
                        <Typography className="text-xs text-ui-text-tertiary">
                          {scope.description}
                        </Typography>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

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
              <DialogFooter>
                <Button variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating..." : "Generate API Key"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Success - Show Generated Key */}
              <div className="text-center">
                <Flex
                  justify="center"
                  align="center"
                  className="mx-auto h-12 w-12 rounded-full bg-status-success-bg mb-4"
                >
                  <Key className="h-6 w-6 text-status-success" />
                </Flex>
                <Typography variant="h3" className="text-lg font-semibold text-ui-text mb-2">
                  API Key Generated!
                </Typography>
                <Typography className="text-sm text-ui-text-secondary mb-6">
                  ⚠️ <strong>Save this key now!</strong> You won't be able to see it again.
                </Typography>

                {/* Generated Key Display */}
                <div className="mb-6 p-4 bg-ui-bg-tertiary rounded-lg">
                  <code className="text-sm font-mono text-status-success break-all select-all">
                    {generatedKey}
                  </code>
                </div>

                {/* Copy Instructions */}
                <div className="text-left mb-6 p-4 bg-status-info-bg rounded-lg text-sm">
                  <Typography className="font-medium text-status-info-text mb-2">
                    Usage Example:
                  </Typography>
                  <code className="block bg-ui-bg p-2 rounded text-xs font-mono">
                    curl -H "Authorization: Bearer {generatedKey.substring(0, 20)}..."
                    https://nixelo.app/api/issues
                  </code>
                </div>

                {/* Actions */}
                <DialogFooter>
                  <Button variant="secondary" onClick={() => onOpenChange(false)}>
                    I've Saved It
                  </Button>
                  <Button variant="primary" onClick={copyAndClose} className="flex-1">
                    <Flex justify="center" gap="sm" align="center">
                      <Copy className="h-4 w-4" />
                      Copy & Close
                    </Flex>
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </div>
      </DialogContent>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>API Key Usage Statistics</DialogTitle>
        </DialogHeader>
        {!stats ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" />
            <Typography className="mt-2 text-sm text-ui-text-tertiary">
              Loading statistics...
            </Typography>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">Total Calls</Typography>
                <Typography className="text-2xl font-bold text-ui-text">
                  {stats.totalCalls.toLocaleString()}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">
                  Last 24 Hours
                </Typography>
                <Typography className="text-2xl font-bold text-ui-text">
                  {stats.last24Hours.toLocaleString()}
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">
                  Success Rate
                </Typography>
                <Typography className="text-2xl font-bold text-status-success">
                  {stats.last24Hours > 0
                    ? Math.round((stats.successCount / stats.last24Hours) * 100)
                    : 100}
                  %
                </Typography>
              </div>
              <div className="p-4 bg-ui-bg-secondary rounded-lg">
                <Typography className="text-xs text-ui-text-secondary mb-1">
                  Avg Response
                </Typography>
                <Typography className="text-2xl font-bold text-ui-text">
                  {stats.avgResponseTime}ms
                </Typography>
              </div>
            </div>

            {/* Recent Requests */}
            <div>
              <Typography variant="h4" className="text-sm font-semibold text-ui-text mb-3">
                Recent Requests
              </Typography>
              {stats.recentLogs.length === 0 ? (
                <Typography className="text-sm text-ui-text-tertiary py-4 text-center">
                  No recent requests
                </Typography>
              ) : (
                <Flex direction="column" gap="sm" className="max-h-64 overflow-y-auto">
                  {stats.recentLogs.map((log: UsageLog) => (
                    <div
                      key={`${log.endpoint}-${log.createdAt}`}
                      className={cn("p-3 bg-ui-bg-secondary rounded-lg text-sm")}
                    >
                      <Flex justify="between" align="center" className="mb-1">
                        <Flex gap="sm" align="center">
                          <Typography variant="small" className="font-mono font-medium">
                            {log.method}
                          </Typography>
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
                    </div>
                  ))}
                </Flex>
              )}
            </div>

            {/* Close Button */}
            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
