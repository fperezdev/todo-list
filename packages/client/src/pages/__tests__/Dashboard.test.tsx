import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import type { Task, TaskCompletion } from "@/lib/types";

const TODAY = "2026-06-09";

// vi.hoisted so mocks are available inside the hoisted vi.mock factory
const { mockExec, mockSelectObjects } = vi.hoisted(() => ({
  mockExec: vi.fn().mockResolvedValue(undefined),
  mockSelectObjects: vi.fn(),
}));

// Pre-built completion records for reuse
const completedTask1: TaskCompletion = {
  id: "comp-task-1-completed",
  task_id: "task-1",
  completion_date: TODAY,
  status: "completed",
  created_at: "2026-06-09T10:00:00.000Z",
  updated_at: "2026-06-09T10:00:00.000Z",
};

const skippedTask1: TaskCompletion = {
  id: "comp-task-1-skipped",
  task_id: "task-1",
  completion_date: TODAY,
  status: "skipped",
  created_at: "2026-06-09T10:00:00.000Z",
  updated_at: "2026-06-09T10:00:00.000Z",
};

const testTasks: Task[] = [
  {
    id: "task-1",
    title: "Hacer ejercicio",
    description: "30 minutos",
    is_recurring: 1,
    weekdays: "[0,1,2,3,4,5,6]",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "task-2",
    title: "Leer",
    description: "",
    is_recurring: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

vi.mock("@/lib/db", () => ({
  getDB: () => ({
    exec: mockExec,
    selectObjects: mockSelectObjects,
  }),
  initDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual<typeof import("@/lib/utils")>("@/lib/utils");
  return {
    ...actual,
    getTodayDate: () => TODAY,
  };
});

import Dashboard from "../Dashboard";

function renderDashboard() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </HelmetProvider>
  );
}

function getSqlFromCall(call: unknown[]): string {
  return typeof call[0] === "object" ? (call[0] as { sql: string }).sql : (call[0] as string);
}

function getBindFromCall(call: unknown[]): unknown[] | undefined {
  return typeof call[0] === "object" ? (call[0] as { bind?: unknown[] }).bind : undefined;
}

/**
 * Set up mock selectObjects responses.
 * After the initial loadData call, we switch to persistent mocks so
 * subsequent loadData calls (triggered by button clicks) don't crash.
 */
function setupMocks(completions: TaskCompletion[]) {
  mockSelectObjects.mockReset();
  // First call (tasks), second call (completions) — both for initial load
  mockSelectObjects
    .mockResolvedValueOnce(testTasks)
    .mockResolvedValueOnce(completions);
  // Persistent fallback for any subsequent loadData calls
  mockSelectObjects.mockResolvedValue([]);
}

describe("Dashboard toggle behavior", () => {
  beforeEach(() => {
    mockExec.mockClear();
    mockSelectObjects.mockClear();
  });

  describe("handleComplete toggle", () => {
    it("inserts new completion when task has no status today (fresh complete)", async () => {
      setupMocks([]); // no completions

      renderDashboard();
      await waitFor(() => {
        expect(screen.queryByText("Cargando tareas...")).not.toBeInTheDocument();
      });

      // Both tasks have no status, so both have "Marcar como completada".
      const allCheckBtns = screen.getAllByRole("button", { name: /marcar como completada/i });
      fireEvent.click(allCheckBtns[0]);

      await waitFor(() => {
        const insertCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("INSERT INTO task_completions")
        );
        expect(insertCalls.length).toBe(1);
        // Status is hard-coded in the SQL text, not in the bind array
        expect(getSqlFromCall(insertCalls[0])).toContain("'completed'");
        const bind = getBindFromCall(insertCalls[0]);
        expect(bind).toBeDefined();
        expect(bind![1]).toBe("task-1");
      });
    });

    it("soft-deletes existing completed (toggle off)", async () => {
      setupMocks([completedTask1]);

      renderDashboard();
      await waitFor(() => {
        expect(screen.queryByText("Cargando tareas...")).not.toBeInTheDocument();
      });

      const checkBtn = screen.getByRole("button", { name: /desmarcar completada/i });
      fireEvent.click(checkBtn);

      await waitFor(() => {
        const updateCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("UPDATE task_completions SET deleted_at")
        );
        expect(updateCalls.length).toBe(1);

        const insertCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("INSERT INTO task_completions")
        );
        expect(insertCalls.length).toBe(0);
      });
    });

    it("switches from skipped to completed", async () => {
      setupMocks([skippedTask1]);

      renderDashboard();
      await waitFor(() => {
        expect(screen.queryByText("Cargando tareas...")).not.toBeInTheDocument();
      });

      const allCheckBtns = screen.getAllByRole("button", { name: /marcar como completada/i });
      fireEvent.click(allCheckBtns[0]);

      await waitFor(() => {
        const updateCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("UPDATE task_completions SET deleted_at")
        );
        expect(updateCalls.length).toBe(1);

        const insertCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("INSERT INTO task_completions")
        );
        expect(insertCalls.length).toBe(1);
        expect(getSqlFromCall(insertCalls[0])).toContain("'completed'");
      });
    });
  });

  describe("handleSkip toggle", () => {
    it("inserts new skipped when task has no status today (fresh skip)", async () => {
      setupMocks([]);

      renderDashboard();
      await waitFor(() => {
        expect(screen.queryByText("Cargando tareas...")).not.toBeInTheDocument();
      });

      const allSkipBtns = screen.getAllByRole("button", { name: /omitir hoy/i });
      fireEvent.click(allSkipBtns[0]);

      await waitFor(() => {
        const insertCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("INSERT INTO task_completions")
        );
        expect(insertCalls.length).toBe(1);
        expect(getSqlFromCall(insertCalls[0])).toContain("'skipped'");
      });
    });

    it("soft-deletes existing skipped (toggle off)", async () => {
      setupMocks([skippedTask1]);

      renderDashboard();
      await waitFor(() => {
        expect(screen.queryByText("Cargando tareas...")).not.toBeInTheDocument();
      });

      const skipBtn = screen.getByRole("button", { name: /desmarcar omitida/i });
      fireEvent.click(skipBtn);

      await waitFor(() => {
        const updateCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("UPDATE task_completions SET deleted_at")
        );
        expect(updateCalls.length).toBe(1);

        const insertCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("INSERT INTO task_completions")
        );
        expect(insertCalls.length).toBe(0);
      });
    });

    it("switches from completed to skipped", async () => {
      setupMocks([completedTask1]);

      renderDashboard();
      await waitFor(() => {
        expect(screen.queryByText("Cargando tareas...")).not.toBeInTheDocument();
      });

      const allSkipBtns = screen.getAllByRole("button", { name: /omitir hoy/i });
      fireEvent.click(allSkipBtns[0]);

      await waitFor(() => {
        const updateCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("UPDATE task_completions SET deleted_at")
        );
        expect(updateCalls.length).toBe(1);

        const insertCalls = mockExec.mock.calls.filter((c) =>
          getSqlFromCall(c).includes("INSERT INTO task_completions")
        );
        expect(insertCalls.length).toBe(1);
        expect(getSqlFromCall(insertCalls[0])).toContain("'skipped'");
      });
    });
  });
});
