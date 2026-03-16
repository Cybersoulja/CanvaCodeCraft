import { describe, it, expect } from "vitest";
import {
  extractInkIdentifiers,
  addExternalFunctionality,
  generateInkBoilerplate,
} from "../ink-utils";

describe("extractInkIdentifiers", () => {
  it("returns empty array for empty string", () => {
    expect(extractInkIdentifiers("")).toEqual([]);
  });

  it("returns empty array for falsy value", () => {
    expect(extractInkIdentifiers(null as unknown as string)).toEqual([]);
  });

  it("returns empty array for script with no identifiers", () => {
    expect(extractInkIdentifiers("Hello, world!\nThis is plain text.")).toEqual([]);
  });

  it("extracts a single VAR declaration", () => {
    expect(extractInkIdentifiers("VAR health = 100")).toContain("health");
  });

  it("extracts multiple VAR declarations", () => {
    const script = "VAR health = 100\nVAR player_name = \"Player\"";
    const result = extractInkIdentifiers(script);
    expect(result).toContain("health");
    expect(result).toContain("player_name");
  });

  it("extracts a CONST declaration", () => {
    expect(extractInkIdentifiers("CONST max_health = 100")).toContain("max_health");
  });

  it("extracts function declarations using === syntax", () => {
    expect(extractInkIdentifiers("=== my_function ===")).toContain("my_function");
  });

  it("extracts function declarations with spaces around name", () => {
    expect(extractInkIdentifiers("===  spaced_func  ===")).toContain("spaced_func");
  });

  it("extracts tag declarations", () => {
    expect(extractInkIdentifiers("# game_start")).toContain("game_start");
  });

  it("extracts tags inline with story text", () => {
    const script = "You enter the forest. # forest_scene";
    expect(extractInkIdentifiers(script)).toContain("forest_scene");
  });

  it("deduplicates identifiers appearing multiple times", () => {
    const script = "VAR health = 100\nVAR health = 200";
    const result = extractInkIdentifiers(script);
    expect(result.filter((id) => id === "health").length).toBe(1);
  });

  it("handles identifiers with underscores and numbers", () => {
    const script = "VAR player_hp_2 = 50";
    expect(extractInkIdentifiers(script)).toContain("player_hp_2");
  });

  it("extracts identifiers from a complex multi-type script", () => {
    const script = [
      "VAR health = 100",
      "CONST max_health = 100",
      "=== start ===",
      "# intro_tag",
    ].join("\n");
    const result = extractInkIdentifiers(script);
    expect(result).toContain("health");
    expect(result).toContain("max_health");
    expect(result).toContain("start");
    expect(result).toContain("intro_tag");
  });

  it("returns an array with no duplicate entries across different types", () => {
    const script = "VAR start = 1\n=== start ===";
    const result = extractInkIdentifiers(script);
    // "start" appears as both a VAR and a knot — should be deduplicated
    expect(result.filter((id) => id === "start").length).toBe(1);
  });
});

describe("addExternalFunctionality", () => {
  it("adds an EXTERNAL declaration for a new function", () => {
    const result = addExternalFunctionality("=== start ===\nHello", ["myFunc"]);
    expect(result).toContain("EXTERNAL myFunc()");
  });

  it("prepends EXTERNAL declarations before the script body", () => {
    const result = addExternalFunctionality("=== start ===", ["myFunc"]);
    expect(result.startsWith("EXTERNAL myFunc()")).toBe(true);
  });

  it("does not duplicate an existing EXTERNAL declaration", () => {
    const script = "EXTERNAL myFunc()\n=== start ===";
    const result = addExternalFunctionality(script, ["myFunc"]);
    const count = (result.match(/EXTERNAL myFunc\(\)/g) || []).length;
    expect(count).toBe(1);
  });

  it("adds multiple EXTERNAL declarations at once", () => {
    const result = addExternalFunctionality("=== start ===", ["func1", "func2"]);
    expect(result).toContain("EXTERNAL func1()");
    expect(result).toContain("EXTERNAL func2()");
  });

  it("returns the script unchanged when no functions are provided", () => {
    const script = "=== start ===\nHello";
    expect(addExternalFunctionality(script, [])).toBe(script);
  });

  it("handles an empty script with function names", () => {
    const result = addExternalFunctionality("", ["fn1"]);
    expect(result).toContain("EXTERNAL fn1()");
  });

  it("only adds EXTERNAL for functions not already declared", () => {
    const script = "EXTERNAL existing()\n=== start ===";
    const result = addExternalFunctionality(script, ["existing", "newFunc"]);
    expect((result.match(/EXTERNAL existing\(\)/g) || []).length).toBe(1);
    expect(result).toContain("EXTERNAL newFunc()");
  });
});

describe("generateInkBoilerplate", () => {
  it("returns a non-empty string", () => {
    const result = generateInkBoilerplate();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("contains standard VAR declarations", () => {
    const result = generateInkBoilerplate();
    expect(result).toContain("VAR health");
    expect(result).toContain("VAR player_name");
  });

  it("contains at least one CONST declaration", () => {
    expect(generateInkBoilerplate()).toContain("CONST ");
  });

  it("contains a start knot", () => {
    expect(generateInkBoilerplate()).toContain("=== start ===");
  });

  it("contains choices using -> divert arrows", () => {
    expect(generateInkBoilerplate()).toContain("->");
  });

  it("contains at least one player choice using * syntax", () => {
    expect(generateInkBoilerplate()).toMatch(/^\*/m);
  });

  it("is valid enough to not contain undefined or null literals", () => {
    const result = generateInkBoilerplate();
    expect(result).not.toContain("undefined");
    expect(result).not.toContain("null");
  });
});
