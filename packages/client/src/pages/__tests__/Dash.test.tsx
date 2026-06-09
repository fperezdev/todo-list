import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import type { Task } from "@/lib/types";

const TODAY = "2026-06-09";

const { mockExec, mockSelectObjects } = vi.hoisted(() => ({
  mockExec: vi.fn().mockResolvedValue(undefined),
  mockSelectObjects: vi.fn(),
}));

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

import Dash from "../Dash";

function renderDash() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <Dash />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe("Dash", () => {
  beforeEach(() => {
    mockExec.mockClear();
    mockSelectObjects.mockClear();
    mockSelectObjects
      .mockResolvedValueOnce(testTasks)
      .mockResolvedValueOnce([])
      .mockResolvedValue([]);
  });

  it("renders the stats page with title after loading", async () => {
    renderDash();

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Estadísticas")).toBeInTheDocument();
  });

  it("shows chart with navigation arrows", async () => {
    renderDash();

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    const prevButtons = screen.getAllByTitle("Anterior");
    const nextButtons = screen.getAllByTitle("Siguiente");
    expect(prevButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
  });

  it("shows period dropdown with all options", async () => {
    renderDash();

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("daily");
    expect(screen.getByText("Diario")).toBeInTheDocument();
    expect(screen.getByText("Semanal")).toBeInTheDocument();
    expect(screen.getByText("Mensual")).toBeInTheDocument();
    expect(screen.getByText("Anual")).toBeInTheDocument();
  });

  it("changes period when dropdown is changed", async () => {
    renderDash();

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "weekly" } });
    expect(select.value).toBe("weekly");
  });

  it("shows total task count", async () => {
    renderDash();

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("2 tareas en total")).toBeInTheDocument();
  });

  it("navigates to next day when next arrow is clicked", async () => {
    renderDash();

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    const nextButtons = screen.getAllByTitle("Siguiente");
    // Clicking next should not crash
    fireEvent.click(nextButtons[0]);
    // After navigation, the component should still render
    expect(screen.getByText("Estadísticas")).toBeInTheDocument();
  });

  it("navigates to previous day when prev arrow is clicked", async () => {
    renderDash();

    await waitFor(() => {
      expect(screen.queryByText("Cargando...")).not.toBeInTheDocument();
    });

    const prevButtons = screen.getAllByTitle("Anterior");
    fireEvent.click(prevButtons[0]);
    expect(screen.getByText("Estadísticas")).toBeInTheDocument();
  });
});
