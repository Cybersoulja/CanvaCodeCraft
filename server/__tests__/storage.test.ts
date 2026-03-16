import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock is hoisted to the top of the file, so we must use vi.hoisted()
// to declare variables that the factory function can safely reference.
const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../db", () => ({ db: mockDb }));

import { DatabaseStorage } from "../storage";

const mockGame = {
  id: 1,
  name: "Test Game",
  scenes: [],
  inkScript: "=== start ===\nHello",
};

const mockElement = {
  id: 1,
  type: "button",
  properties: { text: "Click Me", color: "#000000" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

/** Helpers to build the Drizzle ORM chainable mock */

// For queries like: await db.select().from(table).where(cond)
function mockSelectWhereChain(resolvedValue: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(resolvedValue),
  };
  mockDb.select.mockReturnValue(chain);
  return chain;
}

// For queries like: await db.select().from(table)  (no .where)
function mockSelectFromChain(resolvedValue: unknown[]) {
  const chain = {
    from: vi.fn().mockResolvedValue(resolvedValue),
  };
  mockDb.select.mockReturnValue(chain);
  return chain;
}

function mockInsertChain(resolvedValue: unknown[]) {
  const chain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(resolvedValue),
  };
  mockDb.insert.mockReturnValue(chain);
  return chain;
}

function mockUpdateChain(resolvedValue: unknown[]) {
  const chain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue(resolvedValue),
  };
  mockDb.update.mockReturnValue(chain);
  return chain;
}

describe("DatabaseStorage.getGame", () => {
  it("returns the game when found", async () => {
    mockSelectWhereChain([mockGame]);
    const store = new DatabaseStorage();
    const result = await store.getGame(1);
    expect(result).toEqual(mockGame);
  });

  it("returns undefined when no game is found", async () => {
    mockSelectWhereChain([]);
    const store = new DatabaseStorage();
    const result = await store.getGame(999);
    expect(result).toBeUndefined();
  });
});

describe("DatabaseStorage.createGame", () => {
  it("inserts and returns the new game", async () => {
    mockInsertChain([mockGame]);
    const store = new DatabaseStorage();
    const result = await store.createGame({
      name: "Test Game",
      scenes: [],
      inkScript: "",
    });
    expect(result).toEqual(mockGame);
  });
});

describe("DatabaseStorage.updateGame", () => {
  it("updates and returns the modified game", async () => {
    const updated = { ...mockGame, name: "Updated" };
    mockUpdateChain([updated]);
    const store = new DatabaseStorage();
    const result = await store.updateGame(1, { name: "Updated" });
    expect(result).toEqual(updated);
  });

  it("returns undefined when the game to update does not exist", async () => {
    mockUpdateChain([]);
    const store = new DatabaseStorage();
    const result = await store.updateGame(999, { name: "Ghost" });
    expect(result).toBeUndefined();
  });
});

describe("DatabaseStorage.getAllGames", () => {
  it("returns all games", async () => {
    const chain = { from: vi.fn().mockResolvedValue([mockGame]) };
    mockDb.select.mockReturnValue(chain);
    const store = new DatabaseStorage();
    const result = await store.getAllGames();
    expect(result).toEqual([mockGame]);
  });

  it("returns an empty array when there are no games", async () => {
    const chain = { from: vi.fn().mockResolvedValue([]) };
    mockDb.select.mockReturnValue(chain);
    const store = new DatabaseStorage();
    const result = await store.getAllGames();
    expect(result).toEqual([]);
  });
});

describe("DatabaseStorage.getGameElements", () => {
  it("returns existing elements when they are present", async () => {
    mockSelectFromChain([mockElement]);
    const store = new DatabaseStorage();
    const result = await store.getGameElements();
    expect(result).toEqual([mockElement]);
    // Should NOT insert defaults when elements already exist
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("creates default elements and returns them when the table is empty", async () => {
    // First select returns empty (no elements yet)
    // Second select returns the newly inserted defaults
    const defaultElements = [
      { id: 1, type: "button", properties: { text: "Click Me", color: "#000000" } },
      { id: 2, type: "text", properties: { text: "Sample Text", fontSize: 16, color: "#000000" } },
    ];

    const selectChain = {
      // First call (check if empty): returns []; second call (re-fetch after insert): returns defaultElements
      from: vi.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(defaultElements),
    };
    mockDb.select.mockReturnValue(selectChain);

    const insertChain = { values: vi.fn().mockResolvedValue(undefined) };
    mockDb.insert.mockReturnValue(insertChain);

    const store = new DatabaseStorage();
    const result = await store.getGameElements();

    expect(mockDb.insert).toHaveBeenCalledOnce();
    expect(result).toEqual(defaultElements);
  });

  it("inserts a button and text element as defaults", async () => {
    const selectChain = {
      from: vi.fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    mockDb.select.mockReturnValue(selectChain);

    const insertChain = { values: vi.fn().mockResolvedValue(undefined) };
    mockDb.insert.mockReturnValue(insertChain);

    const store = new DatabaseStorage();
    await store.getGameElements();

    const insertedValues = insertChain.values.mock.calls[0][0] as Array<{
      type: string;
      properties: object;
    }>;
    const types = insertedValues.map((v) => v.type);
    expect(types).toContain("button");
    expect(types).toContain("text");
  });
});
