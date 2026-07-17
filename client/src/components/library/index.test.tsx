import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Library from "./index";

// Regression test for a bug where the library's image thumbnails were
// rendered as plain, non-draggable Cards (no useDrag wiring), so an
// "image" element could never actually be dropped onto the canvas.
// react-dnd's HTML5Backend sets draggable="true" on any DOM node whose
// ref is connected via useDrag, so asserting that attribute is a direct,
// low-complexity check that the drag source is wired up correctly.
describe("Library image drag wiring", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );
  });

  it("makes every image thumbnail a draggable HTML5 drag source", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <Library />
        </DndProvider>
      </QueryClientProvider>
    );

    const images = await screen.findAllByAltText("UI Element");
    expect(images.length).toBeGreaterThan(0);

    for (const image of images) {
      const draggableAncestor = image.closest("[draggable]");
      expect(draggableAncestor).not.toBeNull();
      expect(draggableAncestor).toHaveAttribute("draggable", "true");
    }
  });
});
