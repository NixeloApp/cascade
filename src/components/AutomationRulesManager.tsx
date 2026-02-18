import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { AutomationRuleCard } from "./Automation/AutomationRuleCard";
import { AutomationRuleForm } from "./Automation/AutomationRuleForm";
import { Button } from "./ui/Button";
import { Card, CardBody } from "./ui/Card";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Flex } from "./ui/Flex";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Stack } from "./ui/Stack";
import { Typography } from "./ui/Typography";

interface AutomationRulesManagerProps {
  projectId: Id<"projects">;
}

type AutomationRule = {
  _id: Id<"automationRules">;
  name: string;
  description?: string;
  trigger: string;
  triggerValue?: string;
  actionType: string;
  actionValue: string;
  isActive: boolean;
  executionCount: number;
};

/**
 * Refactored AutomationRulesManager - Now focused on orchestration
 * Form and card logic extracted to separate components
 *
 * Benefits:
 * - Reduced from 398 lines to ~80 lines
 * - Form logic reusable in other contexts
 * - Card component testable in isolation
 * - Easier to maintain and extend
 */
export function AutomationRulesManager({ projectId }: AutomationRulesManagerProps) {
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"automationRules"> | null>(null);

  const rules = useQuery(api.automationRules.list, { projectId });
  const removeRule = useMutation(api.automationRules.remove);

  const handleCreate = () => {
    setEditingRule(null);
    setShowFormDialog(true);
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setShowFormDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await removeRule({ id: deleteConfirm });
      showSuccess("Rule deleted");
    } catch (error) {
      showError(error, "Failed to delete rule");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Flex align="center" justify="between">
        <Stack gap="xs">
          <Typography variant="h3">Automation Rules</Typography>
          <Typography variant="small" color="secondary">
            Automate workflows with trigger-based actions
          </Typography>
        </Stack>
        <Button onClick={handleCreate}>+ Create Rule</Button>
      </Flex>

      {/* Rules List */}
      {rules === undefined ? (
        <Card>
          <CardBody>
            <Flex justify="center" align="center" className="min-h-32">
              <LoadingSpinner size="lg" />
            </Flex>
          </CardBody>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardBody>
            <Stack align="center" gap="sm" className="min-h-32 justify-center">
              <Typography variant="small" color="secondary">
                No automation rules yet
              </Typography>
              <Typography variant="caption">
                Create your first rule to automate repetitive tasks
              </Typography>
            </Stack>
          </CardBody>
        </Card>
      ) : (
        <Stack gap="sm">
          {rules.map((rule: AutomationRule) => (
            <AutomationRuleCard
              key={rule._id}
              rule={rule}
              onEdit={() => handleEdit(rule)}
              onDelete={() => setDeleteConfirm(rule._id)}
            />
          ))}
        </Stack>
      )}

      {/* Form Dialog */}
      <AutomationRuleForm
        projectId={projectId}
        rule={editingRule}
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) {
            setEditingRule(null);
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Automation Rule"
        message="Are you sure you want to delete this rule? This action cannot be undone."
        confirmLabel="Delete"
      />
    </Stack>
  );
}
