import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import type { driver as driverFunction } from "driver.js";
import { useEffect, useState } from "react";

interface WelcomeTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * WelcomeTour component that lazy loads Driver.js (~50 KB)
 * to improve initial page load performance.
 */
export function WelcomeTour({ onComplete, onSkip }: WelcomeTourProps) {
  const updateOnboarding = useMutation(api.onboarding.updateOnboardingStatus);
  const [driverFn, setDriverFn] = useState<typeof driverFunction | null>(null);

  // Lazy load driver.js
  useEffect(() => {
    let mounted = true;

    const loadDriver = async () => {
      try {
        // Dynamically import both driver and its CSS
        const [{ driver }, _] = await Promise.all([
          import("driver.js"),
          import("driver.js/dist/driver.css"),
        ]);

        if (mounted) {
          setDriverFn(() => driver);
        }
      } catch (_error) {
        // Fail silently
      }
    };

    loadDriver();

    return () => {
      mounted = false;
    };
  }, []);

  // Start the tour once Driver is loaded
  useEffect(() => {
    if (!driverFn) return;

    const driverObj = driverFn({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "#root",
          popover: {
            title: "Welcome to Nixelo!",
            description:
              "Nixelo is your all-in-one platform for project management and team collaboration. Let's take a quick tour to get you started!",
            side: "top",
            align: "center",
          },
        },
        {
          element: "[data-tour='command-palette']",
          popover: {
            title: "⌘K Command Palette",
            description:
              "Press <kbd>⌘K</kbd> (Mac) or <kbd>Ctrl+K</kbd> (Windows) to quickly search and navigate anywhere. It's the fastest way to get around!",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='create-project']",
          popover: {
            title: "Create Your First Project",
            description:
              "Workspaces organize your work into teams, issues, and documents. Click here to create your first project, or explore our sample project first!",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='dashboard']",
          popover: {
            title: "Your Dashboard",
            description:
              "This is your home base. See all your projects, recent issues, and activity at a glance. The dashboard updates in real-time as your team works.",
            side: "left",
            align: "start",
          },
        },
        {
          element: "[data-tour='kanban-board']",
          popover: {
            title: "Kanban Board",
            description:
              "Drag and drop issues between columns to update their status. Changes sync in real-time with your whole team!",
            side: "top",
            align: "center",
          },
        },
        {
          element: "[data-tour='create-issue']",
          popover: {
            title: "Create Issues",
            description:
              "Click the + button to create tasks, bugs, stories, and epics. Each column represents a workflow state in your project.",
            side: "left",
            align: "start",
          },
        },
        {
          element: "[data-tour='sidebar']",
          popover: {
            title: "Document Sidebar",
            description:
              "Create and organize documents here. Nixelo combines project management (like Jira) with document collaboration (like Confluence) in one place.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#root",
          popover: {
            title: "Ready to Get Started?",
            description:
              "You're all set! We've created a sample project with demo issues to help you explore. Feel free to edit, delete, or create your own project from scratch.",
            side: "top",
            align: "center",
          },
        },
      ],
      onDestroyStarted: () => {
        if (driverObj.hasNextStep() || driverObj.hasPreviousStep()) {
          // User closed the tour early (skipped)
          onSkip?.();
          void updateOnboarding({
            tourShown: true,
            onboardingStep: 2,
          });
        } else {
          // User completed the tour
          onComplete?.();
          void updateOnboarding({
            tourShown: true,
            onboardingStep: 2,
            onboardingCompleted: false, // Not fully done - still need to create first project
          });
        }
        driverObj.destroy();
      },
    });

    // Start the tour after a short delay to let the page render
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 500);

    return () => {
      clearTimeout(timer);
      driverObj.destroy();
    };
  }, [driverFn, onComplete, onSkip, updateOnboarding]);

  return null; // This component doesn't render anything - it just controls the tour
}
