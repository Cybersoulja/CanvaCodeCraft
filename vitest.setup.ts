import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL's auto-cleanup relies on a global `afterEach`, which isn't registered
// since this project uses explicit imports (`test.globals` is off) rather
// than Vitest's global test API. Without this, components rendered in one
// test stay mounted into the next, and getByText/getByRole queries start
// matching multiple elements across tests in the same file.
afterEach(() => {
  cleanup();
});
