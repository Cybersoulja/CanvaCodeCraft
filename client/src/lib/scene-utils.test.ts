import { describe, it, expect } from "vitest";
import { addElementToScene } from "./scene-utils";
import type { GameElement, Scene } from "@shared/schema";

function makeElement(overrides: Partial<GameElement> = {}): GameElement {
  return {
    id: "el-1",
    type: "text",
    x: 10,
    y: 10,
    width: 100,
    height: 40,
    properties: { text: "Hello" },
    ...overrides,
  };
}

describe("addElementToScene", () => {
  it("appends the element only to the scene matching sceneId", () => {
    const scenes: Scene[] = [
      { id: "1", name: "Start", elements: [] },
      { id: "2", name: "Forest", elements: [] },
    ];
    const element = makeElement();

    const result = addElementToScene(scenes, "2", element);

    expect(result[0].elements).toEqual([]);
    expect(result[1].elements).toEqual([element]);
  });

  it("leaves other scenes' element arrays untouched by reference", () => {
    const untouchedElements: GameElement[] = [];
    const scenes: Scene[] = [{ id: "1", name: "Start", elements: untouchedElements }];

    addElementToScene(scenes, "does-not-exist", makeElement());

    expect(scenes[0].elements).toBe(untouchedElements);
  });

  it("preserves existing elements in the target scene", () => {
    const existing = makeElement({ id: "existing" });
    const scenes: Scene[] = [{ id: "1", name: "Start", elements: [existing] }];

    const result = addElementToScene(scenes, "1", makeElement({ id: "new" }));

    expect(result[0].elements.map((e) => e.id)).toEqual(["existing", "new"]);
  });

  it("does not mutate the original scenes array", () => {
    const scenes: Scene[] = [{ id: "1", name: "Start", elements: [] }];
    const result = addElementToScene(scenes, "1", makeElement());

    expect(result).not.toBe(scenes);
    expect(scenes[0].elements).toEqual([]);
  });
});
