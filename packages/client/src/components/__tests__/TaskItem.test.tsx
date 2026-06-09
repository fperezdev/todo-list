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

function renderTaskItem(
  overrides: {
    isCompletedToday?: boolean;
    isSkippedToday?: boolean;
  } = {}
) {
  const onComplete = vi.fn();
  const onSkip = vi.fn();
  render(
    <TaskItem
      task={mockTask}
      isCompletedToday={overrides.isCompletedToday ?? false}
      isSkippedToday={overrides.isSkippedToday ?? false}
      onComplete={onComplete}
      onSkip={onSkip}
    />
  );
  return { onComplete, onSkip };
}

describe("TaskItem", () => {
  describe("button enabled state", () => {
    it("check button is NOT disabled when task has no status", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      const checkBtn = screen.getByRole("button", { name: /marcar como completada/i });
      expect(checkBtn).not.toBeDisabled();
    });

    it("check button is NOT disabled when task is already completed", () => {
      renderTaskItem({ isCompletedToday: true, isSkippedToday: false });
      const checkBtn = screen.getByRole("button", { name: /desmarcar completada/i });
      expect(checkBtn).not.toBeDisabled();
    });

    it("check button is NOT disabled when task is skipped", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: true });
      const checkBtn = screen.getByRole("button", { name: /marcar como completada/i });
      expect(checkBtn).not.toBeDisabled();
    });

    it("skip button is NOT disabled when task has no status", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      const skipBtn = screen.getByRole("button", { name: /omitir hoy/i });
      expect(skipBtn).not.toBeDisabled();
    });

    it("skip button is NOT disabled when task is already skipped", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: true });
      const skipBtn = screen.getByRole("button", { name: /desmarcar omitida/i });
      expect(skipBtn).not.toBeDisabled();
    });

    it("skip button is NOT disabled when task is completed", () => {
      renderTaskItem({ isCompletedToday: true, isSkippedToday: false });
      const skipBtn = screen.getByRole("button", { name: /omitir hoy/i });
      expect(skipBtn).not.toBeDisabled();
    });
  });

  describe("button titles", () => {
    it("check button shows 'Marcar como completada' when not completed", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      const btn = screen.getByRole("button", { name: /marcar como completada/i });
      expect(btn).toBeInTheDocument();
    });

    it("check button shows 'Desmarcar completada' when already completed", () => {
      renderTaskItem({ isCompletedToday: true, isSkippedToday: false });
      const btn = screen.getByRole("button", { name: /desmarcar completada/i });
      expect(btn).toBeInTheDocument();
    });

    it("skip button shows 'Omitir hoy' when not skipped", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      const btn = screen.getByRole("button", { name: /omitir hoy/i });
      expect(btn).toBeInTheDocument();
    });

    it("skip button shows 'Desmarcar omitida' when already skipped", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: true });
      const btn = screen.getByRole("button", { name: /desmarcar omitida/i });
      expect(btn).toBeInTheDocument();
    });
  });

  describe("click handlers", () => {
    it("calls onComplete when check button is clicked", () => {
      const { onComplete } = renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      const checkBtn = screen.getByRole("button", { name: /marcar como completada/i });
      fireEvent.click(checkBtn);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(mockTask);
    });

    it("calls onComplete when check button is clicked (toggle off)", () => {
      const { onComplete } = renderTaskItem({ isCompletedToday: true, isSkippedToday: false });
      const checkBtn = screen.getByRole("button", { name: /desmarcar completada/i });
      fireEvent.click(checkBtn);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(mockTask);
    });

    it("calls onSkip when skip button is clicked", () => {
      const { onSkip } = renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      const skipBtn = screen.getByRole("button", { name: /omitir hoy/i });
      fireEvent.click(skipBtn);
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onSkip).toHaveBeenCalledWith(mockTask);
    });

    it("calls onSkip when skip button is clicked (toggle off)", () => {
      const { onSkip } = renderTaskItem({ isCompletedToday: false, isSkippedToday: true });
      const skipBtn = screen.getByRole("button", { name: /desmarcar omitida/i });
      fireEvent.click(skipBtn);
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onSkip).toHaveBeenCalledWith(mockTask);
    });

    it("calls onComplete when check on skipped task (switch from skip to complete)", () => {
      const { onComplete } = renderTaskItem({ isCompletedToday: false, isSkippedToday: true });
      const checkBtn = screen.getByRole("button", { name: /marcar como completada/i });
      fireEvent.click(checkBtn);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(mockTask);
    });

    it("calls onSkip when skip on completed task (switch from complete to skip)", () => {
      const { onSkip } = renderTaskItem({ isCompletedToday: true, isSkippedToday: false });
      const skipBtn = screen.getByRole("button", { name: /omitir hoy/i });
      fireEvent.click(skipBtn);
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onSkip).toHaveBeenCalledWith(mockTask);
    });
  });

  describe("visual indicators remain", () => {
    it("shows 'Completada' badge when isCompletedToday is true", () => {
      renderTaskItem({ isCompletedToday: true, isSkippedToday: false });
      expect(screen.getByText("Completada")).toBeInTheDocument();
    });

    it("shows 'Omitida' badge when isSkippedToday is true", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: true });
      expect(screen.getByText("Omitida")).toBeInTheDocument();
    });

    it("does not show 'Completada' badge when not completed", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      expect(screen.queryByText("Completada")).not.toBeInTheDocument();
    });

    it("does not show 'Omitida' badge when not skipped", () => {
      renderTaskItem({ isCompletedToday: false, isSkippedToday: false });
      expect(screen.queryByText("Omitida")).not.toBeInTheDocument();
    });
  });
});
