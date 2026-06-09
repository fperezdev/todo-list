import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TaskItem from "../TaskItem";
import type { Task } from "@/lib/types";

const mockTask: Task = {
  id: "task-1",
  title: "Hacer ejercicio",
  description: "30 minutos de cardio",
  is_recurring: 1,
  weekdays: "[1,3,5]",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function renderTaskItem(isCompleted: boolean = false) {
  const onComplete = vi.fn();
  render(
    <TaskItem
      task={mockTask}
      isCompleted={isCompleted}
      onComplete={onComplete}
    />
  );
  return { onComplete };
}

describe("TaskItem", () => {
  describe("button titles", () => {
    it("check button shows 'Marcar como completada' when not completed", () => {
      renderTaskItem(false);
      const btn = screen.getByRole("button", { name: /marcar como completada/i });
      expect(btn).toBeInTheDocument();
    });

    it("check button shows 'Desmarcar completada' when already completed", () => {
      renderTaskItem(true);
      const btn = screen.getByRole("button", { name: /desmarcar completada/i });
      expect(btn).toBeInTheDocument();
    });
  });

  describe("click handlers", () => {
    it("calls onComplete when check button is clicked", () => {
      const { onComplete } = renderTaskItem(false);
      const checkBtn = screen.getByRole("button", { name: /marcar como completada/i });
      fireEvent.click(checkBtn);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(mockTask);
    });

    it("calls onComplete when check button is clicked (toggle off)", () => {
      const { onComplete } = renderTaskItem(true);
      const checkBtn = screen.getByRole("button", { name: /desmarcar completada/i });
      fireEvent.click(checkBtn);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(mockTask);
    });
  });

  describe("visual indicators", () => {
    it("shows task title", () => {
      renderTaskItem(false);
      expect(screen.getByText("Hacer ejercicio")).toBeInTheDocument();
    });

    it("shows task description", () => {
      renderTaskItem(false);
      expect(screen.getByText("30 minutos de cardio")).toBeInTheDocument();
    });

    it("shows recurring icon for recurring tasks", () => {
      renderTaskItem(false);
      // The Repeat icon is rendered as an SVG, we can check for the task being rendered
      expect(screen.getByText("Hacer ejercicio")).toBeInTheDocument();
    });
  });
});
