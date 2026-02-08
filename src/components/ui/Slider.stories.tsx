import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Label } from "./Label";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "object" },
      description: "The controlled value of the slider",
    },
    defaultValue: {
      control: { type: "object" },
      description: "The default value when uncontrolled",
    },
    min: {
      control: { type: "number" },
      description: "The minimum value of the slider",
    },
    max: {
      control: { type: "number" },
      description: "The maximum value of the slider",
    },
    step: {
      control: { type: "number" },
      description: "The step increment of the slider",
    },
    disabled: {
      control: "boolean",
      description: "Whether the slider is disabled",
    },
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
      description: "The orientation of the slider",
    },
    name: {
      control: "text",
      description: "The name of the slider for form submission",
    },
  },
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Slider>;

// ============================================================================
// Basic States
// ============================================================================

export const Default: Story = {
  args: {
    defaultValue: [50],
  },
  parameters: {
    docs: {
      description: {
        story: "Default slider with a single thumb at 50%.",
      },
    },
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: [75],
  },
  parameters: {
    docs: {
      description: {
        story: "Slider initialized with a value of 75.",
      },
    },
  },
};

export const MinValue: Story = {
  args: {
    defaultValue: [0],
  },
  parameters: {
    docs: {
      description: {
        story: "Slider at the minimum value (0).",
      },
    },
  },
};

export const MaxValue: Story = {
  args: {
    defaultValue: [100],
  },
  parameters: {
    docs: {
      description: {
        story: "Slider at the maximum value (100).",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: [50],
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Disabled slider that cannot be interacted with.",
      },
    },
  },
};

export const DisabledWithValue: Story = {
  args: {
    defaultValue: [75],
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Disabled slider showing a preset value.",
      },
    },
  },
};

// ============================================================================
// Range Slider
// ============================================================================

export const RangeSlider: Story = {
  args: {
    defaultValue: [25, 75],
  },
  parameters: {
    docs: {
      description: {
        story: "Range slider with two thumbs for selecting a value range.",
      },
    },
  },
};

export const RangeSliderNarrow: Story = {
  args: {
    defaultValue: [40, 60],
  },
  parameters: {
    docs: {
      description: {
        story: "Range slider with a narrow selected range.",
      },
    },
  },
};

export const RangeSliderDisabled: Story = {
  args: {
    defaultValue: [25, 75],
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Disabled range slider.",
      },
    },
  },
};

// ============================================================================
// Custom Steps and Ranges
// ============================================================================

export const CustomStep: Story = {
  args: {
    defaultValue: [50],
    step: 10,
  },
  parameters: {
    docs: {
      description: {
        story: "Slider with step increments of 10.",
      },
    },
  },
};

export const CustomRange: Story = {
  args: {
    defaultValue: [500],
    min: 0,
    max: 1000,
  },
  parameters: {
    docs: {
      description: {
        story: "Slider with a custom range from 0 to 1000.",
      },
    },
  },
};

export const SmallRange: Story = {
  args: {
    defaultValue: [5],
    min: 1,
    max: 10,
    step: 1,
  },
  parameters: {
    docs: {
      description: {
        story: "Slider with a small range from 1 to 10.",
      },
    },
  },
};

// ============================================================================
// With Labels and Value Display
// ============================================================================

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80">
      <Label htmlFor="volume-slider">Volume</Label>
      <Slider id="volume-slider" defaultValue={[50]} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Slider with an associated label.",
      },
    },
  },
};

export const WithLabelAndValue: Story = {
  render: function SliderWithLabelAndValue() {
    const [value, setValue] = useState([50]);
    return (
      <div className="flex flex-col gap-3 w-80">
        <div className="flex items-center justify-between">
          <Label htmlFor="brightness-slider">Brightness</Label>
          <span className="text-sm text-ui-text-secondary">{value[0]}%</span>
        </div>
        <Slider id="brightness-slider" value={value} onValueChange={setValue} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Slider with label and current value display.",
      },
    },
  },
};

export const WithMinMaxLabels: Story = {
  render: function SliderWithMinMaxLabels() {
    const [value, setValue] = useState([50]);
    return (
      <div className="flex flex-col gap-2 w-80">
        <div className="flex items-center justify-between">
          <Label htmlFor="range-slider">Select Range</Label>
          <span className="text-sm font-medium text-ui-text">{value[0]}</span>
        </div>
        <Slider id="range-slider" value={value} onValueChange={setValue} />
        <div className="flex justify-between text-xs text-ui-text-tertiary">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Slider with min/max labels below the track.",
      },
    },
  },
};

export const RangeWithValueDisplay: Story = {
  render: function RangeSliderWithDisplay() {
    const [value, setValue] = useState([25, 75]);
    return (
      <div className="flex flex-col gap-3 w-80">
        <div className="flex items-center justify-between">
          <Label>Price Range</Label>
          <span className="text-sm text-ui-text-secondary">
            ${value[0]} - ${value[1]}
          </span>
        </div>
        <Slider value={value} onValueChange={setValue} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Range slider with formatted value display showing selected range.",
      },
    },
  },
};

// ============================================================================
// Controlled Examples
// ============================================================================

export const Controlled: Story = {
  render: function ControlledSlider() {
    const [value, setValue] = useState([30]);
    return (
      <div className="flex flex-col gap-4 w-80">
        <Slider value={value} onValueChange={setValue} />
        <p className="text-sm text-ui-text-secondary">Current value: {value[0]}</p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Controlled slider with external state management.",
      },
    },
  },
};

export const ControlledRange: Story = {
  render: function ControlledRangeSlider() {
    const [value, setValue] = useState([20, 80]);
    return (
      <div className="flex flex-col gap-4 w-80">
        <Slider value={value} onValueChange={setValue} />
        <p className="text-sm text-ui-text-secondary">
          Selected range: {value[0]} to {value[1]}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Controlled range slider with external state management.",
      },
    },
  },
};

// ============================================================================
// Use Case Examples
// ============================================================================

export const VolumeControl: Story = {
  render: function VolumeControlExample() {
    const [volume, setVolume] = useState([75]);
    return (
      <div className="flex items-center gap-4 w-80">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ui-text-secondary"
        >
          <title>Volume icon</title>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <Slider value={volume} onValueChange={setVolume} className="flex-1" />
        <span className="text-sm text-ui-text-secondary w-8 text-right">{volume[0]}</span>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Volume control slider with icon and value display.",
      },
    },
  },
};

export const PriceFilter: Story = {
  render: function PriceFilterExample() {
    const [priceRange, setPriceRange] = useState([100, 500]);
    return (
      <div className="flex flex-col gap-4 w-80 p-4 border border-ui-border rounded-lg bg-ui-bg">
        <p className="text-sm font-medium text-ui-text">Price Filter</p>
        <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={1000} step={10} />
        <div className="flex justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-ui-text-tertiary">Min</span>
            <span className="text-sm font-medium text-ui-text">${priceRange[0]}</span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-xs text-ui-text-tertiary">Max</span>
            <span className="text-sm font-medium text-ui-text">${priceRange[1]}</span>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Price filter range slider commonly used in e-commerce.",
      },
    },
  },
};

export const OpacityControl: Story = {
  render: function OpacityControlExample() {
    const [opacity, setOpacity] = useState([100]);
    return (
      <div className="flex flex-col gap-4 w-80">
        <div className="flex items-center justify-between">
          <Label>Opacity</Label>
          <span className="text-sm text-ui-text-secondary">{opacity[0]}%</span>
        </div>
        <Slider value={opacity} onValueChange={setOpacity} />
        <div
          className="h-20 rounded-md bg-brand flex items-center justify-center"
          style={{ opacity: opacity[0] / 100 }}
        >
          <span className="text-brand-foreground text-sm font-medium">Preview</span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Opacity slider with live preview of the effect.",
      },
    },
  },
};

export const TemperatureSetting: Story = {
  render: function TemperatureSettingExample() {
    const [temp, setTemp] = useState([21]);
    const getTemperatureColor = (value: number) => {
      if (value < 18) return "text-status-info";
      if (value > 24) return "text-status-error";
      return "text-status-success";
    };
    return (
      <div className="flex flex-col gap-4 w-80 p-4 border border-ui-border rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ui-text">Room Temperature</p>
          <span className={`text-2xl font-semibold ${getTemperatureColor(temp[0])}`}>
            {temp[0]}°C
          </span>
        </div>
        <Slider value={temp} onValueChange={setTemp} min={15} max={30} step={1} />
        <div className="flex justify-between text-xs text-ui-text-tertiary">
          <span>15°C</span>
          <span>30°C</span>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Temperature setting slider with color-coded feedback.",
      },
    },
  },
};

// ============================================================================
// Form Integration
// ============================================================================

export const FormExample: Story = {
  render: function FormSliderExample() {
    const [budget, setBudget] = useState([5000]);
    return (
      <form
        className="flex flex-col gap-6 w-80"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          console.log("Form submitted:", Object.fromEntries(formData));
        }}
      >
        <p className="text-sm font-medium text-ui-text">Project Budget</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="budget">Monthly Budget</Label>
            <span className="text-sm font-medium text-brand">${budget[0].toLocaleString()}</span>
          </div>
          <Slider
            id="budget"
            name="budget"
            value={budget}
            onValueChange={setBudget}
            min={1000}
            max={10000}
            step={500}
          />
          <div className="flex justify-between text-xs text-ui-text-tertiary">
            <span>$1,000</span>
            <span>$10,000</span>
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand text-brand-foreground rounded-md text-sm font-medium hover:bg-brand-hover transition-default"
        >
          Save Budget
        </button>
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Slider integrated into a form with submission handling.",
      },
    },
  },
};

// ============================================================================
// All States Comparison
// ============================================================================

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8 w-80">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Default (50%)</span>
        <Slider defaultValue={[50]} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Min Value (0%)</span>
        <Slider defaultValue={[0]} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Max Value (100%)</span>
        <Slider defaultValue={[100]} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Range Slider</span>
        <Slider defaultValue={[25, 75]} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Disabled</span>
        <Slider defaultValue={[50]} disabled />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Disabled Range</span>
        <Slider defaultValue={[25, 75]} disabled />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Overview of all slider states for comparison.",
      },
    },
  },
};

export const StepComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-80">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Step: 1 (default)</span>
        <Slider defaultValue={[50]} step={1} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Step: 5</span>
        <Slider defaultValue={[50]} step={5} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Step: 10</span>
        <Slider defaultValue={[50]} step={10} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-text-secondary">Step: 25</span>
        <Slider defaultValue={[50]} step={25} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comparison of sliders with different step values.",
      },
    },
  },
};
