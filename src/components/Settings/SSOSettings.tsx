import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { Input, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Typography } from "@/components/ui/Typography";
import { Key, Plus, Settings, Trash2 } from "@/lib/icons";
import { showError, showSuccess } from "@/lib/toast";

interface SSOSettingsProps {
  organizationId: Id<"organizations">;
}

type ConnectionType = "saml" | "oidc";

/**
 * SSO Settings component for managing SAML/OIDC connections.
 * Admin-only feature for organization authentication configuration.
 */
export function SSOSettings({ organizationId }: SSOSettingsProps) {
  const connections = useQuery(api.sso.list, { organizationId });
  const createConnection = useMutation(api.sso.create);
  const removeConnection = useMutation(api.sso.remove);
  const setEnabled = useMutation(api.sso.setEnabled);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<Id<"ssoConnections"> | null>(null);
  const [newConnectionType, setNewConnectionType] = useState<ConnectionType>("saml");
  const [newConnectionName, setNewConnectionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!newConnectionName.trim()) {
      showError(new Error("Please enter a name"), "Invalid name");
      return;
    }

    setIsLoading(true);
    try {
      await createConnection({
        organizationId,
        type: newConnectionType,
        name: newConnectionName.trim(),
      });
      showSuccess("SSO connection created");
      setIsCreateDialogOpen(false);
      setNewConnectionName("");
    } catch (error) {
      showError(error, "Failed to create connection");
    } finally {
      setIsLoading(false);
    }
  }, [createConnection, organizationId, newConnectionType, newConnectionName]);

  const handleDelete = useCallback(
    async (connectionId: Id<"ssoConnections">) => {
      if (!window.confirm("Are you sure you want to delete this SSO connection?")) {
        return;
      }

      setIsLoading(true);
      try {
        const result = await removeConnection({ connectionId });
        if (result.success) {
          showSuccess("SSO connection deleted");
        } else {
          showError(new Error(result.error || "Failed to delete"), "Error");
        }
      } catch (error) {
        showError(error, "Failed to delete connection");
      } finally {
        setIsLoading(false);
      }
    },
    [removeConnection],
  );

  const handleToggle = useCallback(
    async (connectionId: Id<"ssoConnections">, currentState: boolean) => {
      setIsLoading(true);
      try {
        const result = await setEnabled({ connectionId, isEnabled: !currentState });
        if (result.success) {
          showSuccess(currentState ? "SSO connection disabled" : "SSO connection enabled");
        } else {
          showError(new Error(result.error || "Failed to update"), "Error");
        }
      } catch (error) {
        showError(error, "Failed to update connection");
      } finally {
        setIsLoading(false);
      }
    },
    [setEnabled],
  );

  if (connections === undefined) {
    return (
      <Card>
        <CardBody>
          <Flex align="center" justify="center" className="py-8">
            <LoadingSpinner size="md" />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Flex align="center" justify="between">
        <div>
          <Typography variant="h4">Single Sign-On (SSO)</Typography>
          <Typography variant="caption">
            Configure SAML or OIDC authentication for your organization
          </Typography>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Icon icon={Plus} size="sm" />
          Add Connection
        </Button>
      </Flex>

      {connections.length === 0 ? (
        <Card>
          <CardBody>
            <Flex direction="column" align="center" gap="md" className="py-8">
              <Icon icon={Key} size="xl" className="text-ui-text-tertiary" />
              <Typography variant="muted" className="text-center">
                No SSO connections configured.
                <br />
                Add a SAML or OIDC connection to enable enterprise sign-in.
              </Typography>
            </Flex>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <Card key={connection._id}>
              <CardBody>
                <Flex align="center" justify="between">
                  <Flex align="center" gap="md">
                    <Icon icon={Key} size="lg" className="text-brand" />
                    <div>
                      <Flex align="center" gap="sm">
                        <Typography variant="label">{connection.name}</Typography>
                        <Badge variant={connection.type === "saml" ? "brand" : "accent"} size="sm">
                          {connection.type.toUpperCase()}
                        </Badge>
                        <Badge variant={connection.isEnabled ? "success" : "secondary"} size="sm">
                          {connection.isEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </Flex>
                      {connection.verifiedDomains && connection.verifiedDomains.length > 0 && (
                        <Typography variant="caption">
                          Domains: {connection.verifiedDomains.join(", ")}
                        </Typography>
                      )}
                    </div>
                  </Flex>

                  <Flex gap="sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedConnection(connection._id);
                        setIsConfigDialogOpen(true);
                      }}
                    >
                      <Icon icon={Settings} size="sm" />
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(connection._id, connection.isEnabled)}
                      disabled={isLoading}
                    >
                      {connection.isEnabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(connection._id)}
                      disabled={isLoading}
                    >
                      <Icon icon={Trash2} size="sm" className="text-status-error" />
                    </Button>
                  </Flex>
                </Flex>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Alert variant="info">
        <AlertTitle>Enterprise SSO</AlertTitle>
        <AlertDescription>
          SSO allows your team members to sign in using your organization's identity provider (IdP)
          like Okta, Azure AD, or Google Workspace. Once configured, users with verified email
          domains will be automatically routed to your SSO provider.
        </AlertDescription>
      </Alert>

      {/* Create Connection Dialog */}
      <Dialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        title="Add SSO Connection"
        description="Create a new SAML or OIDC connection for your organization"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading || !newConnectionName.trim()}>
              {isLoading ? <LoadingSpinner size="sm" /> : "Create Connection"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Connection Name"
            value={newConnectionName}
            onChange={(e) => setNewConnectionName(e.target.value)}
            placeholder="e.g., Okta, Azure AD, Google Workspace"
          />

          <div>
            <Typography variant="label" className="mb-2">
              Connection Type
            </Typography>
            <Flex gap="sm">
              <Button
                variant={newConnectionType === "saml" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setNewConnectionType("saml")}
              >
                SAML 2.0
              </Button>
              <Button
                variant={newConnectionType === "oidc" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setNewConnectionType("oidc")}
              >
                OIDC
              </Button>
            </Flex>
          </div>
        </div>
      </Dialog>

      {/* Configuration Dialog */}
      {selectedConnection && (
        <SSOConfigDialog
          connectionId={selectedConnection}
          open={isConfigDialogOpen}
          onOpenChange={(open) => {
            setIsConfigDialogOpen(open);
            if (!open) setSelectedConnection(null);
          }}
        />
      )}
    </div>
  );
}

interface SSOConfigDialogProps {
  connectionId: Id<"ssoConnections">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SSOConfigDialog({ connectionId, open, onOpenChange }: SSOConfigDialogProps) {
  const connection = useQuery(api.sso.get, { connectionId });
  const updateSamlConfig = useMutation(api.sso.updateSamlConfig);
  const updateOidcConfig = useMutation(api.sso.updateOidcConfig);
  const updateDomains = useMutation(api.sso.updateDomains);

  const [isLoading, setIsLoading] = useState(false);

  // SAML fields
  const [idpEntityId, setIdpEntityId] = useState("");
  const [idpSsoUrl, setIdpSsoUrl] = useState("");
  const [idpCertificate, setIdpCertificate] = useState("");

  // OIDC fields
  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  // Common fields
  const [domains, setDomains] = useState("");

  // Initialize fields when connection loads
  useEffect(() => {
    if (connection) {
      if (connection.type === "saml" && connection.samlConfig) {
        setIdpEntityId(connection.samlConfig.idpEntityId || "");
        setIdpSsoUrl(connection.samlConfig.idpSsoUrl || "");
        setIdpCertificate(connection.samlConfig.idpCertificate || "");
      } else if (connection.type === "oidc" && connection.oidcConfig) {
        setIssuer(connection.oidcConfig.issuer || "");
        setClientId(connection.oidcConfig.clientId || "");
      }
      setDomains(connection.verifiedDomains?.join(", ") || "");
    }
  }, [connection]);

  const handleSave = useCallback(async () => {
    if (!connection) return;

    setIsLoading(true);
    try {
      // Update configuration
      if (connection.type === "saml") {
        const result = await updateSamlConfig({
          connectionId,
          config: {
            idpEntityId: idpEntityId || undefined,
            idpSsoUrl: idpSsoUrl || undefined,
            idpCertificate: idpCertificate || undefined,
          },
        });
        if (!result.success) {
          showError(new Error(result.error || "Failed to update"), "Error");
          setIsLoading(false);
          return;
        }
      } else {
        const result = await updateOidcConfig({
          connectionId,
          config: {
            issuer: issuer || undefined,
            clientId: clientId || undefined,
            clientSecret: clientSecret || undefined,
          },
        });
        if (!result.success) {
          showError(new Error(result.error || "Failed to update"), "Error");
          setIsLoading(false);
          return;
        }
      }

      // Update domains
      const domainList = domains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      const domainsResult = await updateDomains({ connectionId, domains: domainList });
      if (!domainsResult.success) {
        showError(new Error(domainsResult.error || "Failed to update domains"), "Error");
        setIsLoading(false);
        return;
      }

      showSuccess("Configuration saved");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to save configuration");
    } finally {
      setIsLoading(false);
    }
  }, [
    connection,
    connectionId,
    updateSamlConfig,
    updateOidcConfig,
    updateDomains,
    idpEntityId,
    idpSsoUrl,
    idpCertificate,
    issuer,
    clientId,
    clientSecret,
    domains,
    onOpenChange,
  ]);

  if (!connection) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} title="Configure SSO">
        <Flex align="center" justify="center" className="py-8">
          <LoadingSpinner size="md" />
        </Flex>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Configure ${connection.name}`}
      description={`Set up ${connection.type.toUpperCase()} configuration`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : "Save Configuration"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {connection.type === "saml" ? (
          <>
            <Input
              label="IdP Entity ID"
              value={idpEntityId}
              onChange={(e) => setIdpEntityId(e.target.value)}
              placeholder="https://idp.example.com/entity"
            />
            <Input
              label="IdP SSO URL"
              value={idpSsoUrl}
              onChange={(e) => setIdpSsoUrl(e.target.value)}
              placeholder="https://idp.example.com/sso"
            />
            <Textarea
              label="IdP Certificate (PEM format)"
              value={idpCertificate}
              onChange={(e) => setIdpCertificate(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----"
              rows={4}
            />
          </>
        ) : (
          <>
            <Input
              label="Issuer URL"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="https://accounts.google.com"
            />
            <Input
              label="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="your-client-id"
            />
            <Input
              label="Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="••••••••••••"
              type="password"
            />
          </>
        )}

        <div className="border-t border-ui-border pt-4">
          <Input
            label="Verified Domains"
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="acme.com, acme.io"
          />
          <Typography variant="caption" className="mt-1">
            Comma-separated list of domains. Users with these email domains will be routed to this
            SSO connection.
          </Typography>
        </div>
      </div>
    </Dialog>
  );
}
