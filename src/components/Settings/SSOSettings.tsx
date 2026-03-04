/**
 * SSO Settings
 *
 * Configuration UI for Single Sign-On (SSO) providers.
 * Allows admins to set up SAML/OIDC identity providers for the organization.
 * Supports metadata import, attribute mapping, and connection testing.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Flex } from "@/components/ui/Flex";
import { Input, Textarea } from "@/components/ui/form";
import { Icon } from "@/components/ui/Icon";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Stack } from "@/components/ui/Stack";
import { Typography } from "@/components/ui/Typography";
import { Key, Plus, Settings, Trash2 } from "@/lib/icons";
import { getOidcPresetConfig, type OidcProviderPreset } from "@/lib/sso-oidc-presets";
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

  const handleCreate = async () => {
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
  };

  const handleDelete = async (connectionId: Id<"ssoConnections">) => {
    if (!window.confirm("Are you sure you want to delete this SSO connection?")) {
      return;
    }

    setIsLoading(true);
    try {
      await removeConnection({ connectionId });
      showSuccess("SSO connection deleted");
    } catch (error) {
      showError(error, "Failed to delete connection");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (connectionId: Id<"ssoConnections">, currentState: boolean) => {
    setIsLoading(true);
    try {
      // Mutations now throw errors instead of returning { success: boolean, error?: string }
      await setEnabled({ connectionId, isEnabled: !currentState });
      showSuccess(currentState ? "SSO connection disabled" : "SSO connection enabled");
    } catch (error) {
      showError(error, "Failed to update connection");
    } finally {
      setIsLoading(false);
    }
  };

  if (connections === undefined) {
    return (
      <Card>
        <CardBody>
          <Flex align="center" justify="center" className="min-h-32">
            <LoadingSpinner size="md" />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Stack gap="lg">
      <Flex align="center" justify="between">
        <Stack gap="xs">
          <Typography variant="h4">Single Sign-On (SSO)</Typography>
          <Typography variant="caption">
            Configure SAML or OIDC authentication for your organization
          </Typography>
        </Stack>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Icon icon={Plus} size="sm" />
          Add Connection
        </Button>
      </Flex>

      {connections.length === 0 ? (
        <Card>
          <CardBody>
            <Flex direction="column" align="center" justify="center" gap="md" className="min-h-32">
              <Icon icon={Key} size="xl" className="text-ui-text-tertiary" />
              <Typography variant="small" color="secondary" className="text-center">
                No SSO connections configured.
                <br />
                Add a SAML or OIDC connection to enable enterprise sign-in.
              </Typography>
            </Flex>
          </CardBody>
        </Card>
      ) : (
        <Stack gap="md">
          {connections.map((connection) => (
            <Card key={connection._id}>
              <CardBody>
                <Flex align="center" justify="between">
                  <Flex align="center" gap="md">
                    <Icon icon={Key} size="lg" className="text-brand" />
                    <Stack gap="xs">
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
                    </Stack>
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
        </Stack>
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
        <Stack gap="md">
          <Input
            label="Connection Name"
            value={newConnectionName}
            onChange={(e) => setNewConnectionName(e.target.value)}
            placeholder="e.g., Okta, Azure AD, Google Workspace"
          />

          <Stack gap="sm">
            <Typography variant="label">Connection Type</Typography>
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
          </Stack>
        </Stack>
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
    </Stack>
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
  const [authorizationUrl, setAuthorizationUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [userInfoUrl, setUserInfoUrl] = useState("");
  const [scopes, setScopes] = useState("");
  const [oidcProvider, setOidcProvider] = useState<
    "google-workspace" | "microsoft-entra" | "okta" | undefined
  >(undefined);

  // Common fields
  const [domains, setDomains] = useState("");

  // Initialize fields when connection loads
  useEffect(() => {
    if (!connection) return;

    // Initialize type-specific fields
    if (connection.type === "saml" && connection.samlConfig) {
      setIdpEntityId(connection.samlConfig.idpEntityId || "");
      setIdpSsoUrl(connection.samlConfig.idpSsoUrl || "");
      setIdpCertificate(connection.samlConfig.idpCertificate || "");
    }
    if (connection.type === "oidc" && connection.oidcConfig) {
      setOidcProvider(connection.oidcConfig.provider);
      setIssuer(connection.oidcConfig.issuer || "");
      setClientId(connection.oidcConfig.clientId || "");
      setAuthorizationUrl(connection.oidcConfig.authorizationUrl || "");
      setTokenUrl(connection.oidcConfig.tokenUrl || "");
      setUserInfoUrl(connection.oidcConfig.userInfoUrl || "");
      setScopes(connection.oidcConfig.scopes?.join(", ") || "");
    }
    // Initialize common fields
    setDomains(connection.verifiedDomains?.join(", ") || "");
  }, [connection]);

  // Parse domains from comma-separated string
  const parseDomains = () =>
    domains
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

  const applyOidcPreset = (preset: OidcProviderPreset) => {
    const config = getOidcPresetConfig(preset);
    setOidcProvider(config.provider);
    setIssuer(config.issuer);
    setAuthorizationUrl(config.authorizationUrl);
    setTokenUrl(config.tokenUrl);
    setUserInfoUrl(config.userInfoUrl);
    setScopes(config.scopes.join(", "));
  };

  const parseScopes = () =>
    scopes
      .split(",")
      .map((scope) => scope.trim())
      .filter((scope) => scope.length > 0);

  // Save SAML configuration
  const saveSamlConfig = () =>
    updateSamlConfig({
      connectionId,
      config: {
        idpEntityId: idpEntityId || undefined,
        idpSsoUrl: idpSsoUrl || undefined,
        idpCertificate: idpCertificate || undefined,
      },
    });

  // Save OIDC configuration
  const saveOidcConfig = () =>
    updateOidcConfig({
      connectionId,
      config: {
        provider: oidcProvider,
        // Keep empty scopes as undefined to avoid storing noise.
        scopes: (() => {
          const parsed = parseScopes();
          return parsed.length > 0 ? parsed : undefined;
        })(),
        issuer: issuer || undefined,
        clientId: clientId || undefined,
        clientSecret: clientSecret || undefined,
        authorizationUrl: authorizationUrl || undefined,
        tokenUrl: tokenUrl || undefined,
        userInfoUrl: userInfoUrl || undefined,
      },
    });

  const handleSave = async () => {
    if (!connection) return;

    setIsLoading(true);
    try {
      // Update type-specific configuration (mutations throw on error)
      if (connection.type === "saml") {
        await saveSamlConfig();
      } else {
        await saveOidcConfig();
      }

      // Update domains (mutation throws on error)
      await updateDomains({ connectionId, domains: parseDomains() });

      showSuccess("Configuration saved");
      onOpenChange(false);
    } catch (error) {
      showError(error, "Failed to save configuration");
    } finally {
      setIsLoading(false);
    }
  };

  if (!connection) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} title="Configure SSO">
        <Flex align="center" justify="center" className="min-h-32">
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
      <Stack gap="md">
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
            <Stack gap="sm">
              <Typography variant="label">Provider Presets</Typography>
              <Flex wrap gap="sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyOidcPreset("google-workspace")}
                >
                  Google Workspace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyOidcPreset("microsoft-entra")}
                >
                  Microsoft Entra
                </Button>
                <Button variant="ghost" size="sm" onClick={() => applyOidcPreset("okta")}>
                  Okta
                </Button>
              </Flex>
              {oidcProvider && (
                <Typography variant="caption" color="secondary">
                  Active provider profile: {oidcProvider}
                </Typography>
              )}
            </Stack>
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
            <Input
              label="Authorization URL (optional)"
              value={authorizationUrl}
              onChange={(e) => setAuthorizationUrl(e.target.value)}
              placeholder="https://provider.example.com/oauth2/v2.0/authorize"
            />
            <Input
              label="Token URL (optional)"
              value={tokenUrl}
              onChange={(e) => setTokenUrl(e.target.value)}
              placeholder="https://provider.example.com/oauth2/v2.0/token"
            />
            <Input
              label="User Info URL (optional)"
              value={userInfoUrl}
              onChange={(e) => setUserInfoUrl(e.target.value)}
              placeholder="https://provider.example.com/userinfo"
            />
            <Input
              label="Scopes (comma-separated)"
              value={scopes}
              onChange={(e) => setScopes(e.target.value)}
              placeholder="openid, profile, email"
            />
          </>
        )}

        <Stack gap="sm" className="border-t border-ui-border pt-4">
          <Input
            label="Verified Domains"
            value={domains}
            onChange={(e) => setDomains(e.target.value)}
            placeholder="acme.com, acme.io"
          />
          <Typography variant="caption">
            Comma-separated list of domains. Users with these email domains will be routed to this
            SSO connection.
          </Typography>
        </Stack>
      </Stack>
    </Dialog>
  );
}
