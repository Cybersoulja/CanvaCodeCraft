import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Canvas from "./index";
import type { Scene } from "@shared/schema";

const SCENE_WITH_TEXT: Scene = {
  id: "1",
  name: "Start Scene",
  elements: [
    { id: "el-1", type: "text", x: 10, y: 10, width: 100, height: 40, properties: { text: "Hello" } },
  ],
};

interface RenderOptions {
  scenes?: Scene[];
  currentSceneId?: string;
}

// Regression tests for a bug where Canvas kept its own local `scenes` state
// instead of receiving it from the parent, so elements dropped onto the
// canvas never reached the state that gets saved/exported. Canvas is now a
// controlled component: it must render purely from props and report every
// change via callbacks rather than owning any scene state itself.
function renderCanvas({ scenes = [SCENE_WITH_TEXT], currentSceneId = "1" }: RenderOptions = {}) {
  const onSceneChange = vi.fn();
  const onScenesChange = vi.fn();
  const onSelectElement = vi.fn();

  render(
    <DndProvider backend={HTML5Backend}>
      <Canvas
        scenes={scenes}
        currentSceneId={currentSceneId}
        onSceneChange={onSceneChange}
        onScenesChange={onScenesChange}
        onSelectElement={onSelectElement}
      />
    </DndProvider>
  );

  return { scenes, onSceneChange, onScenesChange, onSelectElement };
}

describe("Canvas (controlled component)", () => {
  it("renders elements from the scenes prop rather than local state", () => {
    renderCanvas();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders only the elements belonging to currentSceneId", () => {
    renderCanvas({
      scenes: [
        { id: "1", name: "Start", elements: [{ id: "a", type: "text", x: 0, y: 0, width: 10, height: 10, properties: { text: "SceneOneText" } }] },
        { id: "2", name: "Forest", elements: [{ id: "b", type: "text", x: 0, y: 0, width: 10, height: 10, properties: { text: "SceneTwoText" } }] },
      ],
      currentSceneId: "2",
    });

    expect(screen.queryByText("SceneOneText")).not.toBeInTheDocument();
    expect(screen.getByText("SceneTwoText")).toBeInTheDocument();
  });

  it("reports scene selection via onSceneChange instead of switching internally", async () => {
    const user = userEvent.setup();
    const { onSceneChange } = renderCanvas({
      scenes: [
        { id: "1", name: "Start", elements: [] },
        { id: "2", name: "Forest", elements: [] },
      ],
    });

    await user.selectOptions(screen.getByRole("combobox"), "2");

    expect(onSceneChange).toHaveBeenCalledWith("2");
    // Still showing scene 1's (empty) canvas: Canvas must wait for the
    // parent to pass a new currentSceneId, not switch on its own.
    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
  });

  it("reports new scenes via onScenesChange instead of storing them locally", async () => {
    const user = userEvent.setup();
    const { scenes, onScenesChange } = renderCanvas();

    await user.click(screen.getByText("Add Scene"));

    expect(onScenesChange).toHaveBeenCalledTimes(1);
    const updatedScenes = onScenesChange.mock.calls[0][0] as Scene[];
    expect(updatedScenes).toHaveLength(scenes.length + 1);
    expect(updatedScenes[0]).toBe(scenes[0]);
  });
});
