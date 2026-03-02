import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";

type InvoiceLineItem = {
  description: string;
  quantity: number;
  rate: number;
};

type EditableInvoiceLineItem = InvoiceLineItem & {
  localId: string;
};

interface InvoiceEditorProps {
  initialLineItems: InvoiceLineItem[];
  onSave: (lineItems: InvoiceLineItem[]) => Promise<void>;
  isSaving?: boolean;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * Interactive editor for invoice line items and subtotal calculation.
 */
export function InvoiceEditor({ initialLineItems, onSave, isSaving = false }: InvoiceEditorProps) {
  const [lineItems, setLineItems] = useState<EditableInvoiceLineItem[]>(
    initialLineItems.map((line, index) => ({
      ...line,
      localId: `${line.description}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    })),
  );

  const subtotal = lineItems.reduce((sum, line) => sum + line.quantity * line.rate, 0);

  const updateLineItem = (index: number, next: Partial<InvoiceLineItem>) => {
    setLineItems((previous) =>
      previous.map((line, currentIndex) =>
        currentIndex === index
          ? {
              ...line,
              ...next,
            }
          : line,
      ),
    );
  };

  const addLine = () => {
    setLineItems((previous) => [
      ...previous,
      {
        description: "",
        quantity: 1,
        rate: 0,
        localId: `invoice-line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      },
    ]);
  };

  const removeLine = (index: number) => {
    setLineItems((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {lineItems.map((line, index) => (
          <div
            key={line.localId}
            className="grid grid-cols-1 gap-2 rounded-lg border border-ui-border p-3 lg:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <Input
              value={line.description}
              placeholder="Line item description"
              onChange={(event) => updateLineItem(index, { description: event.target.value })}
            />
            <Input
              type="number"
              min={0.01}
              step={0.25}
              value={line.quantity}
              onChange={(event) =>
                updateLineItem(index, { quantity: Number.parseFloat(event.target.value || "0") })
              }
            />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={line.rate}
              onChange={(event) =>
                updateLineItem(index, { rate: Number.parseFloat(event.target.value || "0") })
              }
            />
            <Button variant="ghost" onClick={() => removeLine(index)}>
              Remove
            </Button>
          </div>
        ))}

        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={addLine}>
            Add line
          </Button>
          <Typography variant="h4">Subtotal: {formatCurrency(subtotal)}</Typography>
        </div>

        <Button
          onClick={() =>
            onSave(
              lineItems.map((line) => ({
                description: line.description,
                quantity: line.quantity,
                rate: line.rate,
              })),
            )
          }
          isLoading={isSaving}
          disabled={lineItems.length === 0 || lineItems.some((line) => !line.description.trim())}
        >
          Save line items
        </Button>
      </CardContent>
    </Card>
  );
}
