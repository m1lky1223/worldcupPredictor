---
name: gsd
description: Executing Get Stuff Done (GSD) context-engineering and phase-management workflows.
---

# GSD Workflow Execution Skill

This skill equips the Antigravity agent with the ability to orchestrate and execute Get Stuff Done (GSD) spec-driven project management workflows in this repository.

## Capabilities

When this skill is loaded, the agent is trained to interpret and run any GSD command defined in the [.opencode/command/](file:///Users/rony/dev/worldcupPredictor/.opencode/command) directory.

---

## Workflow Execution Protocol

Whenever a user requests to run a GSD command (e.g., "run `gsd-new-project`" or "execute `/gsd-plan-phase 1`"), follow these steps:

1. **Load Command Specification**:
   * Navigate to the [.opencode/command/](file:///Users/rony/dev/worldcupPredictor/.opencode/command) folder.
   * View the markdown file corresponding to the command (e.g., [gsd-new-project.md](file:///Users/rony/dev/worldcupPredictor/.opencode/command/gsd-new-project.md) or [gsd-plan-phase.md](file:///Users/rony/dev/worldcupPredictor/.opencode/command/gsd-plan-phase.md)).

2. **Acknowledge Context and Objectives**:
   * Read the `<objective>`, `<context>`, and `<process>` tags to align on the expected deliverables and process steps.
   * Check if there are execution hooks or specific scripts linked under `<execution_context>` (e.g. files in `gsd-core/workflows/`).

3. **Sequential Process Execution**:
   * Execute the steps described in the workflow process.
   * Use the terminal to trigger helper scripts (such as running `node .opencode/gsd-core/bin/gsd-tools.cjs <command>`).
   * Spawn GSD subagents (like `gsd-planner` or `gsd-executor`) using `invoke_subagent` if the workflow instructs it.
   * Prompt the user for design decisions or verification approvals when the workflow calls for user interaction.
