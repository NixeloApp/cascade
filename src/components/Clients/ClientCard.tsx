/**
 * Client Card
 *
 * Displays a single client's details: name, email, company, hourly rate.
 * Includes portal link generation and reactive token management.
 * Token list auto-updates via Convex reactive query.
 */

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { useAuthenticatedMutation, useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
import { useOrganization } from "@/hooks/useOrgContext";
import { formatDate } from "@/lib/formatting";
import { showError, showSuccess } from "@/lib/toast";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Select } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

export interface ProjectOption {
  _id: string;
  name: string;
}

interface PortalTokenDetailsProps {
  clientId: Id<"clients">;
  organizationId: Id<"organizations">;
}

function PortalTokenDetails({ clientId, organizationId }: PortalTokenDetailsProps) {
  const tokens =
    useAuthenticatedQuery(api.clientPortal.listTokensByClientReactive, {
      organizationId,
      clientId,
    }) ?? [];
  const { mutate: revokePortalToken } = useAuthenticatedMutation(api.clientPortal.revokeToken);

  const handleRevoke = async (tokenId: Id<"clientPortalTokens">) => {
    try {
      await revokePortalToken({ organizationId, tokenId });
      showSuccess("Portal token revoked");
    } catch (error) {
      showError(error, "Failed to revoke portal token");
    }
  };

  if (tokens.length === 0) {
    return null;
  }

  return (
    <Stack gap="sm">
      <Typography variant="caption" color="secondary">
        {tokens.length} {tokens.length === 1 ? "token" : "tokens"}
      </Typography>
      {tokens.map((token) => (
        <div key={token._id} className="border-t border-ui-border">
          <Flex align="center" justify="between" gap="sm">
            <Stack gap="xs">
              <Flex align="center" gap="sm">
                <Badge size="sm" variant={token.isRevoked ? "error" : "success"}>
                  {token.isRevoked ? "Revoked" : "Active"}
                </Badge>
                <Typography variant="caption" color="secondary">
                  {formatDate(token.updatedAt)}
                </Typography>
              </Flex>
              {token.lastAccessedAt ? (
                <Typography variant="caption" color="tertiary">
                  Last accessed {formatDate(token.lastAccessedAt)}
                </Typography>
              ) : null}
            </Stack>
            {!token.isRevoked ? (
              <Button variant="ghost" size="sm" onClick={() => handleRevoke(token._id)}>
                Revoke
              </Button>
            ) : null}
          </Flex>
        </div>
      ))}
    </Stack>
  );
}

export interface ClientCardProps {
  client: Doc<"clients">;
  projects: ProjectOption[];
}

export function ClientCard({ client, projects }: ClientCardProps) {
  const { organizationId, userRole } = useOrganization();
  const isAdmin = userRole === "admin" || userRole === "owner";
  const { mutate: generatePortalToken } = useAuthenticatedMutation(api.clientPortal.generateToken);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?._id ?? "");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleGeneratePortalLink = async () => {
    try {
      if (!selectedProjectId) {
        showError("Select a project to scope the portal link");
        return;
      }

      const response = await generatePortalToken({
        organizationId,
        clientId: client._id,
        projectIds: [selectedProjectId as Id<"projects">],
        permissions: {
          viewIssues: true,
          viewDocuments: false,
          viewTimeline: true,
          addComments: false,
        },
      });

      setGeneratedLink(response.portalPath);
      showSuccess("Portal link generated");
    } catch (error) {
      showError(error, "Failed to generate portal link");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{client.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Stack gap="sm">
          <Typography variant="small">{client.email}</Typography>
          {client.company ? (
            <Typography variant="small" color="secondary">
              {client.company}
            </Typography>
          ) : null}
          <Typography variant="small" color="secondary">
            Default rate: ${client.hourlyRate?.toFixed(2) ?? "0.00"}
          </Typography>
          {isAdmin ? (
            <Stack gap="sm">
              <Flex wrap gap="sm" align="end">
                {projects.length > 1 ? (
                  <Select
                    onChange={setSelectedProjectId}
                    options={projects.map((project) => ({
                      value: project._id,
                      label: project.name,
                    }))}
                    placeholder="Select project"
                    value={selectedProjectId}
                  />
                ) : null}
                <Button
                  variant="secondary"
                  disabled={!selectedProjectId}
                  onClick={handleGeneratePortalLink}
                >
                  Generate portal link
                </Button>
              </Flex>
              {generatedLink ? (
                <Typography variant="caption" className="text-brand">
                  {generatedLink}
                </Typography>
              ) : null}
              <PortalTokenDetails clientId={client._id} organizationId={organizationId} />
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
