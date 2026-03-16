import { describe, it, expect } from "vitest";
import { insertGameSchema, insertGameElementSchema } from "../schema";

const validScene = {
  id: "scene-1",
  name: "Opening Scene",
  elements: [],
};

const validGame = {
  name: "My Game",
  scenes: [validScene],
  inkScript: "=== start ===\nHello!",
};

describe("insertGameSchema", () => {
  it("accepts a valid game object", () => {
    const result = insertGameSchema.safeParse(validGame);
    expect(result.success).toBe(true);
  });

  it("rejects a game with missing name", () => {
    const result = insertGameSchema.safeParse({
      scenes: [],
      inkScript: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a game with missing scenes", () => {
    const result = insertGameSchema.safeParse({
      name: "Game",
      inkScript: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a game with missing inkScript", () => {
    const result = insertGameSchema.safeParse({
      name: "Game",
      scenes: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a game with an empty inkScript", () => {
    const result = insertGameSchema.safeParse({ ...validGame, inkScript: "" });
    expect(result.success).toBe(true);
  });

  it("accepts a game with multiple scenes", () => {
    const result = insertGameSchema.safeParse({
      ...validGame,
      scenes: [validScene, { ...validScene, id: "scene-2", name: "Scene 2" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a game where name is not a string", () => {
    const result = insertGameSchema.safeParse({ ...validGame, name: 42 });
    expect(result.success).toBe(false);
  });

  it("rejects a game where inkScript is not a string", () => {
    const result = insertGameSchema.safeParse({ ...validGame, inkScript: 123 });
    expect(result.success).toBe(false);
  });
});

describe("insertGameElementSchema", () => {
  const validElement = {
    type: "button",
    properties: { text: "Click Me", color: "#000000" },
  };

  it("accepts a valid game element", () => {
    const result = insertGameElementSchema.safeParse(validElement);
    expect(result.success).toBe(true);
  });

  it("accepts a text element with fontSize", () => {
    const result = insertGameElementSchema.safeParse({
      type: "text",
      properties: { text: "Hello", fontSize: 16, color: "#000" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an image element with imageUrl", () => {
    const result = insertGameElementSchema.safeParse({
      type: "image",
      properties: { imageUrl: "https://example.com/img.png" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an element with missing type", () => {
    const result = insertGameElementSchema.safeParse({
      properties: { text: "Hi" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an element with missing properties", () => {
    const result = insertGameElementSchema.safeParse({ type: "button" });
    expect(result.success).toBe(false);
  });

  it("accepts an element with an empty properties object", () => {
    const result = insertGameElementSchema.safeParse({
      type: "button",
      properties: {},
    });
    expect(result.success).toBe(true);
  });
});
