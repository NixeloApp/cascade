import { useEffect, useState } from "react";
import { HourComplianceDashboard } from "../Admin/HourComplianceDashboard";
import { IpRestrictionsSettings } from "../Admin/IpRestrictionsSettings";
import { OAuthFeatureFlagSettings } from "../Admin/OAuthFeatureFlagSettings";
import { OAuthHealthDashboard } from "../Admin/OAuthHealthDashboard";
import { OrganizationSettings } from "../Admin/OrganizationSettings";
import { UserManagement } from "../Admin/UserManagement";
import { UserTypeManager } from "../Admin/UserTypeManager";
import { PageControls, PageStack } from "../layout";
import { RouteNav, RouteNavItem } from "../ui/RouteNav";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

const ADMIN_SECTION_ID_PREFIX = "settings-admin";

const ADMIN_SECTIONS = [
  { key: "organization", label: "Organization", Component: OrganizationSettings },
  { key: "oauth-health", label: "OAuth Health", Component: OAuthHealthDashboard },
  { key: "oauth-flags", label: "Auth Flags", Component: OAuthFeatureFlagSettings },
  { key: "ip-restrictions", label: "IP Restrictions", Component: IpRestrictionsSettings },
  { key: "user-management", label: "Users", Component: UserManagement },
  { key: "user-types", label: "User Types", Component: UserTypeManager },
  { key: "hour-compliance", label: "Compliance", Component: HourComplianceDashboard },
] as const;

type AdminSectionKey = (typeof ADMIN_SECTIONS)[number]["key"];

function getAdminSectionId(sectionKey: AdminSectionKey) {
  return `${ADMIN_SECTION_ID_PREFIX}-${sectionKey}`;
}

function getSectionFromHash(hash: string): AdminSectionKey | null {
  const normalizedHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const matchingSection = ADMIN_SECTIONS.find(
    ({ key }) => getAdminSectionId(key) === normalizedHash,
  );

  return matchingSection?.key ?? null;
}

function getInitialActiveSection() {
  if (typeof window === "undefined") {
    return ADMIN_SECTIONS[0].key;
  }

  return getSectionFromHash(window.location.hash) ?? ADMIN_SECTIONS[0].key;
}

function scrollToAdminSection(sectionKey: AdminSectionKey) {
  const section = document.getElementById(getAdminSectionId(sectionKey));
  section?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

/**
 * Settings admin surface with a shared controls band and anchor navigation for
 * the heavier admin panels below.
 */
export function AdminTab() {
  const [activeSection, setActiveSection] = useState<AdminSectionKey>(() =>
    getInitialActiveSection(),
  );

  useEffect(() => {
    const syncActiveSection = () => {
      const sectionFromHash = getSectionFromHash(window.location.hash);
      if (sectionFromHash) {
        setActiveSection(sectionFromHash);
        scrollToAdminSection(sectionFromHash);
      }
    };

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);

    return () => {
      window.removeEventListener("hashchange", syncActiveSection);
    };
  }, []);

  return (
    <PageStack>
      <PageControls padding="sm" gap="sm" spacing="stack">
        <Stack gap="xs">
          <Typography variant="label">Admin controls</Typography>
          <Typography variant="small" color="secondary">
            Manage organization policy, OAuth safety, access controls, and compliance from one admin
            workspace instead of a loose card stack.
          </Typography>
        </Stack>

        <RouteNav variant="pill" size="sm" aria-label="Admin sections">
          {ADMIN_SECTIONS.map(({ key, label }) => {
            return (
              <RouteNavItem
                key={key}
                active={activeSection === key}
                variant="pill"
                size="sm"
                onClick={() => {
                  window.location.hash = getAdminSectionId(key);
                  setActiveSection(key);
                  scrollToAdminSection(key);
                }}
              >
                {label}
              </RouteNavItem>
            );
          })}
        </RouteNav>
      </PageControls>

      <Stack gap="xl">
        {ADMIN_SECTIONS.map(({ key, label, Component }) => (
          <section key={key} id={getAdminSectionId(key)} aria-label={label}>
            <Component />
          </section>
        ))}
      </Stack>
    </PageStack>
  );
}

export { getAdminSectionId };
