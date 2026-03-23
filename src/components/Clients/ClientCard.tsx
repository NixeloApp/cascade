/**
 * Client Card
 *
 * Displays a single client's details: name, email, company, hourly rate.
 * Includes portal link generation and token management.
 */

import type { Doc, Id } from "@convex/_generated/dataModel";
import { useState } from "react";
import { formatDate } from "@/lib/formatting";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

export interface ClientPortalTokenRow {
  _id: Id<"clientPortalTokens">;
  isRevoked: boolean;
  expiresAt?: number;
  lastAccessedAt?: number;
  updatedAt: number;
}

export interface ProjectOption {
  _id: string;
  name: string;
}

interface PortalTokenDetailsProps {
  clientId: Id<"clients">;
  onRevokePortalToken: (clientId: Id<"clients">, tokenId: Id<"clientPortalTokens">) => void;
  tokens: ClientPortalTokenRow[];
}

export function PortalTokenDetails({
  clientId,
  onRevokePortalToken,
  tokens,
}: PortalTokenDetailsProps) {
  return tokens.map((token) => (
    <div key={token._id} className="mt-2 border-t border-ui-border p-3">
      <Stack gap="xs">
        <Typography variant="caption">Token: {token._id}</Typography>
        <Flex align="center" gap="sm">
          <Typography variant="caption">Status:</Typography>
          <Badge size="sm" variant={token.isRevoked ? "error" : "success"}>
            {token.isRevoked ? "Revoked" : "Active"}
          </Badge>
        </Flex>
        <Typography variant="caption">Updated: {formatDate(token.updatedAt)}</Typography>
        {token.lastAccessedAt ? (
          <Typography variant="caption">
            Last accessed: {formatDate(token.lastAccessedAt)}
          </Typography>
        ) : null}
        {token.expiresAt ? (
          <Typography variant="caption">Expires: {formatDate(token.expiresAt)}</Typography>
        ) : null}
      </Stack>
      {!token.isRevoked ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1"
          onClick={() => onRevokePortalToken(clientId, token._id)}
        >
          Revoke token
        </Button>
      ) : null}
    </div>
  ));
}

export interface ClientCardProps {
  client: Doc<"clients">;
  generatedPortalLink?: string;
  onGeneratePortalLink: (clientId: Id<"clients">, projectId: string) => void;
  onRefreshPortalTokens: (clientId: Id<"clients">) => void;
  onRevokePortalToken: (clientId: Id<"clients">, tokenId: Id<"clientPortalTokens">) => void;
  portalTokens: ClientPortalTokenRow[];
  projects: ProjectOption[];
}

export function ClientCard({
  client,
  generatedPortalLink,
  onGeneratePortalLink,
  onRefreshPortalTokens,
  onRevokePortalToken,
  portalTokens,
  projects,
}: ClientCardProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?._id ?? "");

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
          <Stack gap="sm">
            <Flex wrap gap="sm" align="end">
              {projects.length > 1 ? (
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Button
                variant="secondary"
                disabled={!selectedProjectId}
                onClick={() => onGeneratePortalLink(client._id, selectedProjectId)}
              >
                Generate portal link
              </Button>
              <Button variant="ghost" onClick={() => onRefreshPortalTokens(client._id)}>
                Refresh tokens
              </Button>
            </Flex>
            {generatedPortalLink ? (
              <Typography variant="caption" className="text-brand">
                {generatedPortalLink}
              </Typography>
            ) : null}
            <PortalTokenDetails
              clientId={client._id}
              onRevokePortalToken={onRevokePortalToken}
              tokens={portalTokens}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
