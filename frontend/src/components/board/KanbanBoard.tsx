import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import type { Lane, Task } from '../../types/index.js';
import { LaneColumn } from './LaneColumn.js';
import { TaskCard } from './TaskCard.js';

interface KanbanBoardProps {
  lanes: Lane[];
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onToggleTimer: (taskId: string) => void;
  onMoveTask: (taskId: string, targetLaneId: string, newRank: string) => void;
  onAddTask: (laneId: string, title: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  lanes,
  tasks,
  onSelectTask,
  onToggleTimer,
  onMoveTask,
  onAddTask
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure sensors for smooth desktop & touch mobile interaction
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5
    }
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5
    }
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t.id === activeId);
    if (!task) return;

    // Check if dropped directly onto a lane column
    const targetLane = lanes.find((l) => l.id === overId);
    if (targetLane) {
      if (task.laneId !== targetLane.id) {
        onMoveTask(task.id, targetLane.id, `0|${Date.now()}:`);
      }
      return;
    }

    // Dropped onto another task card
    const targetTask = tasks.find((t) => t.id === overId);
    if (targetTask) {
      const newRank = `0|${Date.now()}:`;
      onMoveTask(task.id, targetTask.laneId, newRank);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto h-[calc(100vh-3.5rem)] items-start">
        {lanes.map((lane) => {
          const laneTasks = tasks.filter((t) => t.laneId === lane.id);
          return (
            <LaneColumn
              key={lane.id}
              lane={lane}
              tasks={laneTasks}
              onSelectTask={onSelectTask}
              onToggleTimer={onToggleTimer}
              onAddTask={onAddTask}
            />
          );
        })}
      </div>

      {/* Drag Overlay for smooth preview */}
      <DragOverlay>
        {activeTask ? (
          <div className="w-80 opacity-90 scale-105 rotate-2 pointer-events-none shadow-2xl">
            <TaskCard
              task={activeTask}
              onSelect={() => {}}
              onToggleTimer={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
