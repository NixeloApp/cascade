import type { Meta, StoryObj } from "@storybook/react";
import { Star } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Flex } from "./Flex";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the table",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

// ============================================================================
// Sample Data
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  avatarUrl?: string;
}

const sampleUsers: User[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "active" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "Editor", status: "active" },
  { id: "3", name: "Carol White", email: "carol@example.com", role: "Viewer", status: "pending" },
  { id: "4", name: "David Brown", email: "david@example.com", role: "Editor", status: "inactive" },
  { id: "5", name: "Eva Martinez", email: "eva@example.com", role: "Admin", status: "active" },
];

interface Invoice {
  id: string;
  client: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  date: string;
}

const sampleInvoices: Invoice[] = [
  { id: "INV-001", client: "Acme Corp", amount: 1250.0, status: "paid", date: "2024-01-15" },
  { id: "INV-002", client: "Globex Inc", amount: 3400.0, status: "pending", date: "2024-01-20" },
  { id: "INV-003", client: "Initech", amount: 890.5, status: "overdue", date: "2024-01-10" },
  { id: "INV-004", client: "Umbrella Corp", amount: 5200.0, status: "paid", date: "2024-01-25" },
  {
    id: "INV-005",
    client: "Stark Industries",
    amount: 15000.0,
    status: "pending",
    date: "2024-01-28",
  },
];

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
}

const sampleProducts: Product[] = [
  {
    id: "P001",
    name: "Wireless Mouse",
    category: "Electronics",
    price: 29.99,
    stock: 150,
    rating: 4.5,
  },
  {
    id: "P002",
    name: "Mechanical Keyboard",
    category: "Electronics",
    price: 89.99,
    stock: 75,
    rating: 4.8,
  },
  { id: "P003", name: "USB-C Hub", category: "Accessories", price: 45.0, stock: 200, rating: 4.2 },
  {
    id: "P004",
    name: "Monitor Stand",
    category: "Furniture",
    price: 79.99,
    stock: 30,
    rating: 4.0,
  },
  { id: "P005", name: "Desk Lamp", category: "Furniture", price: 34.99, stock: 0, rating: 3.9 },
];

// ============================================================================
// Basic Table
// ============================================================================

export const Default: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.slice(0, 3).map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const BasicTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Column 1</TableHead>
          <TableHead>Column 2</TableHead>
          <TableHead>Column 3</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Row 1, Cell 1</TableCell>
          <TableCell>Row 1, Cell 2</TableCell>
          <TableCell>Row 1, Cell 3</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Row 2, Cell 1</TableCell>
          <TableCell>Row 2, Cell 2</TableCell>
          <TableCell>Row 2, Cell 3</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Row 3, Cell 1</TableCell>
          <TableCell>Row 3, Cell 2</TableCell>
          <TableCell>Row 3, Cell 3</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// ============================================================================
// Table with Caption
// ============================================================================

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of recent team members and their roles.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium text-ui-text">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              <Badge
                variant={
                  user.status === "active"
                    ? "success"
                    : user.status === "pending"
                      ? "warning"
                      : "neutral"
                }
              >
                {user.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ============================================================================
// Table with Footer
// ============================================================================

export const WithFooter: Story = {
  render: () => {
    const total = sampleInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    return (
      <Table>
        <TableCaption>Invoice summary for January 2024.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleInvoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium text-ui-text">{invoice.id}</TableCell>
              <TableCell>{invoice.client}</TableCell>
              <TableCell>{invoice.date}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    invoice.status === "paid"
                      ? "success"
                      : invoice.status === "pending"
                        ? "warning"
                        : "error"
                  }
                >
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">${total.toLocaleString()}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );
  },
};

// ============================================================================
// Sortable Table
// ============================================================================

type SortDirection = "asc" | "desc" | null;
type SortField = "name" | "category" | "price" | "stock" | "rating";

function SortableTableDemo() {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedProducts = [...sampleProducts].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 text-ui-text-tertiary">&#x2195;</span>;
    return <span className="ml-1 text-brand">{sortDirection === "asc" ? "\u2191" : "\u2193"}</span>;
  };

  const sortableHeadClass = "cursor-pointer select-none hover:bg-ui-bg-hover transition-colors";

  return (
    <Table>
      <TableCaption>Click column headers to sort. Click again to reverse or clear.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className={sortableHeadClass} onClick={() => handleSort("name")}>
            <Flex align="center">
              Product
              <SortIcon field="name" />
            </Flex>
          </TableHead>
          <TableHead className={sortableHeadClass} onClick={() => handleSort("category")}>
            <Flex align="center">
              Category
              <SortIcon field="category" />
            </Flex>
          </TableHead>
          <TableHead className={sortableHeadClass} onClick={() => handleSort("price")}>
            <Flex align="center">
              Price
              <SortIcon field="price" />
            </Flex>
          </TableHead>
          <TableHead className={sortableHeadClass} onClick={() => handleSort("stock")}>
            <Flex align="center">
              Stock
              <SortIcon field="stock" />
            </Flex>
          </TableHead>
          <TableHead className={sortableHeadClass} onClick={() => handleSort("rating")}>
            <Flex align="center">
              Rating
              <SortIcon field="rating" />
            </Flex>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedProducts.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium text-ui-text">{product.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{product.category}</Badge>
            </TableCell>
            <TableCell>${product.price.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant={product.stock > 0 ? "success" : "error"}>
                {product.stock > 0 ? product.stock : "Out of stock"}
              </Badge>
            </TableCell>
            <TableCell>{product.rating.toFixed(1)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const Sortable: Story = {
  render: () => <SortableTableDemo />,
};

// ============================================================================
// Selectable Rows
// ============================================================================

function SelectableTableDemo() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    if (selectedIds.size === sampleUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sampleUsers.map((u) => u.id)));
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected = selectedIds.size === sampleUsers.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sampleUsers.length;

  return (
    <Flex direction="column" gap="md">
      <Flex justify="between" align="center">
        <span className="text-sm text-ui-text-secondary">
          {selectedIds.size} of {sampleUsers.length} selected
        </span>
        {selectedIds.size > 0 && (
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
            Clear selection
          </Button>
        )}
      </Flex>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleUsers.map((user) => (
            <TableRow key={user.id} data-state={selectedIds.has(user.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(user.id)}
                  onCheckedChange={() => toggleOne(user.id)}
                  aria-label={`Select ${user.name}`}
                />
              </TableCell>
              <TableCell className="font-medium text-ui-text">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    user.status === "active"
                      ? "success"
                      : user.status === "pending"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {user.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Flex>
  );
}

export const SelectableRows: Story = {
  render: () => <SelectableTableDemo />,
};

// ============================================================================
// With Avatars
// ============================================================================

export const WithAvatars: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <Flex align="center" gap="sm">
                <Avatar size="sm">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-ui-text">{user.name}</span>
              </Flex>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant="outline">{user.role}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  user.status === "active"
                    ? "success"
                    : user.status === "pending"
                      ? "warning"
                      : "neutral"
                }
                shape="pill"
              >
                {user.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ============================================================================
// Different Data Types
// ============================================================================

export const NumericData: Story = {
  render: () => (
    <Table>
      <TableCaption>Monthly sales performance by region.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Region</TableHead>
          <TableHead className="text-right">Q1</TableHead>
          <TableHead className="text-right">Q2</TableHead>
          <TableHead className="text-right">Q3</TableHead>
          <TableHead className="text-right">Q4</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium text-ui-text">North America</TableCell>
          <TableCell className="text-right tabular-nums">$125,000</TableCell>
          <TableCell className="text-right tabular-nums">$142,500</TableCell>
          <TableCell className="text-right tabular-nums">$168,000</TableCell>
          <TableCell className="text-right tabular-nums">$195,000</TableCell>
          <TableCell className="text-right tabular-nums font-medium text-ui-text">
            $630,500
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-ui-text">Europe</TableCell>
          <TableCell className="text-right tabular-nums">$98,000</TableCell>
          <TableCell className="text-right tabular-nums">$110,000</TableCell>
          <TableCell className="text-right tabular-nums">$125,000</TableCell>
          <TableCell className="text-right tabular-nums">$145,000</TableCell>
          <TableCell className="text-right tabular-nums font-medium text-ui-text">
            $478,000
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-ui-text">Asia Pacific</TableCell>
          <TableCell className="text-right tabular-nums">$75,000</TableCell>
          <TableCell className="text-right tabular-nums">$88,500</TableCell>
          <TableCell className="text-right tabular-nums">$102,000</TableCell>
          <TableCell className="text-right tabular-nums">$118,000</TableCell>
          <TableCell className="text-right tabular-nums font-medium text-ui-text">
            $383,500
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="text-right tabular-nums">$298,000</TableCell>
          <TableCell className="text-right tabular-nums">$341,000</TableCell>
          <TableCell className="text-right tabular-nums">$395,000</TableCell>
          <TableCell className="text-right tabular-nums">$458,000</TableCell>
          <TableCell className="text-right tabular-nums font-semibold">$1,492,000</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const DateAndTime: Story = {
  render: () => (
    <Table>
      <TableCaption>Recent activity log.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Duration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium text-ui-text">Document created</TableCell>
          <TableCell>Alice Johnson</TableCell>
          <TableCell className="tabular-nums">2024-01-28</TableCell>
          <TableCell className="tabular-nums">09:15:32</TableCell>
          <TableCell className="tabular-nums">-</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-ui-text">Meeting scheduled</TableCell>
          <TableCell>Bob Smith</TableCell>
          <TableCell className="tabular-nums">2024-01-28</TableCell>
          <TableCell className="tabular-nums">10:30:00</TableCell>
          <TableCell className="tabular-nums">1h 30m</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-ui-text">Code review completed</TableCell>
          <TableCell>Carol White</TableCell>
          <TableCell className="tabular-nums">2024-01-27</TableCell>
          <TableCell className="tabular-nums">16:45:12</TableCell>
          <TableCell className="tabular-nums">45m</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-ui-text">Deployment finished</TableCell>
          <TableCell>David Brown</TableCell>
          <TableCell className="tabular-nums">2024-01-27</TableCell>
          <TableCell className="tabular-nums">18:20:00</TableCell>
          <TableCell className="tabular-nums">12m</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const MixedContent: Story = {
  render: () => (
    <Table>
      <TableCaption>Product inventory with various data types.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">ID</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="text-center">Stock</TableHead>
          <TableHead className="text-center">Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleProducts.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-mono text-xs text-ui-text-tertiary">{product.id}</TableCell>
            <TableCell className="font-medium text-ui-text">{product.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{product.category}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">${product.price.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              {product.stock > 0 ? (
                <Badge variant={product.stock > 50 ? "success" : "warning"}>{product.stock}</Badge>
              ) : (
                <Badge variant="error">Out of stock</Badge>
              )}
            </TableCell>
            <TableCell className="text-center">
              <Flex justify="center" align="center" gap="xs">
                <Star className="w-4 h-4 fill-status-warning text-status-warning" />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
              </Flex>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

// ============================================================================
// Common Patterns
// ============================================================================

export const StripeRows: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.map((user, index) => (
          <TableRow key={user.id} className={index % 2 === 1 ? "bg-ui-bg-soft" : ""}>
            <TableCell className="font-medium text-ui-text">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const CompactTable: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="h-8 px-2 text-xs">Name</TableHead>
          <TableHead className="h-8 px-2 text-xs">Email</TableHead>
          <TableHead className="h-8 px-2 text-xs">Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleUsers.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="p-2 text-sm">{user.name}</TableCell>
            <TableCell className="p-2 text-sm">{user.email}</TableCell>
            <TableCell className="p-2 text-sm">{user.role}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const ActionColumn: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleInvoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium text-ui-text">{invoice.id}</TableCell>
            <TableCell>{invoice.client}</TableCell>
            <TableCell className="tabular-nums">${invoice.amount.toLocaleString()}</TableCell>
            <TableCell>
              <Badge
                variant={
                  invoice.status === "paid"
                    ? "success"
                    : invoice.status === "pending"
                      ? "warning"
                      : "error"
                }
              >
                {invoice.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Flex justify="end" gap="xs">
                <Button variant="ghost" size="sm">
                  View
                </Button>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-status-error hover:text-status-error"
                >
                  Delete
                </Button>
              </Flex>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            <Flex direction="column" align="center" gap="sm">
              <span className="text-ui-text-tertiary">No users found</span>
              <Button size="sm">Add your first user</Button>
            </Flex>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// ============================================================================
// All Components Showcase
// ============================================================================

export const AllComponents: Story = {
  render: () => (
    <Flex direction="column" gap="lg">
      <div>
        <h3 className="mb-3 text-sm font-medium text-ui-text-secondary">Full Featured Table</h3>
        <Table>
          <TableCaption>Comprehensive example showing all table components.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox aria-label="Select all" />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox aria-label={`Select ${user.name}`} />
                </TableCell>
                <TableCell>
                  <Flex align="center" gap="sm">
                    <Avatar size="sm">
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-ui-text">{user.name}</span>
                  </Flex>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.status === "active"
                        ? "success"
                        : user.status === "pending"
                          ? "warning"
                          : "neutral"
                    }
                    shape="pill"
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Flex justify="end" gap="xs">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm">
                      Delete
                    </Button>
                  </Flex>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5}>Total Users</TableCell>
              <TableCell className="text-right font-medium">{sampleUsers.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Flex>
  ),
};
