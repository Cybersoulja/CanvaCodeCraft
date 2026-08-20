import { requestExport } from "@canva/design";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { App } from "src/intents/design_editor/app";
import { renderInTestProvider } from "src/utils/test_render";

// @canva/design is already mocked globally in jest.setup.ts.
// This test demonstrates how to test code that uses functions from the Canva Apps SDK
// For more information on testing with the Canva Apps SDK, see https://www.canva.dev/docs/apps/testing/
describe("Send to CanvaCodeCraft", () => {
  const mockRequestExport = jest.mocked(requestExport);
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("exports the design and uploads it to CanvaCodeCraft on success", async () => {
    mockRequestExport.mockResolvedValue({
      status: "completed",
      title: "My design",
      exportBlobs: [{ url: "https://export.canva.com/blob" }],
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1 }) });

    renderInTestProvider(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Send to CanvaCodeCraft" }));

    await waitFor(() =>
      expect(screen.getAllByText(/My design.*was sent/).length).toBeGreaterThan(0),
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const [uploadUrl, uploadOptions] = (global.fetch as jest.Mock).mock.calls[1];
    expect(uploadUrl).toContain("/api/canva-app/designs");
    expect(uploadOptions.method).toBe("POST");
  });

  it("shows an error when the upload is rejected", async () => {
    mockRequestExport.mockResolvedValue({
      status: "completed",
      title: "My design",
      exportBlobs: [{ url: "https://export.canva.com/blob" }],
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ message: "Invalid secret" }) });

    renderInTestProvider(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Send to CanvaCodeCraft" }));

    await waitFor(() => expect(screen.getAllByText("Invalid secret").length).toBeGreaterThan(0));
  });

  it("does nothing when the user aborts the export", async () => {
    mockRequestExport.mockResolvedValue({ status: "aborted" });

    renderInTestProvider(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Send to CanvaCodeCraft" }));

    await waitFor(() => expect(mockRequestExport).toHaveBeenCalled());
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
