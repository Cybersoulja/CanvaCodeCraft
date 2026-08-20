import { useState } from "react";
import { Alert, Box, Button, Rows, Text } from "@canva/app-ui-kit";
import { requestExport } from "@canva/design";
import { FormattedMessage, useIntl } from "react-intl";
import * as styles from "styles/components.css";

type SendState =
  | { status: "idle" }
  | { status: "exporting" }
  | { status: "uploading" }
  | { status: "success"; name: string }
  | { status: "error"; message: string };

// BACKEND_HOST and CANVA_APP_SHARED_SECRET are injected at build time by
// webpack.config.ts (see DefinePlugin), sourced from .env's
// CANVA_BACKEND_HOST / CANVA_APP_SHARED_SECRET. BACKEND_HOST should point
// at the CanvaCodeCraft deployment this app sends designs to.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export const App = () => {
  const intl = useIntl();
  const [state, setState] = useState<SendState>({ status: "idle" });

  const sendToCanvaCodeCraft = async () => {
    setState({ status: "exporting" });
    try {
      const exportResult = await requestExport({
        acceptedFileTypes: ["png"],
      });

      if (exportResult.status === "aborted") {
        setState({ status: "idle" });
        return;
      }

      // Single-page designs export as one PNG blob. A multi-page design
      // exported as PNG (which doesn't support multiple pages) zips into
      // this same single URL instead — that zip would get uploaded here
      // mislabeled as image/png, which is a known limitation for now.
      const blob = exportResult.exportBlobs[0];
      if (!blob) {
        throw new Error("Canva did not return an exported file");
      }
      const name = exportResult.title || `Canva design ${new Date().toLocaleString()}`;

      setState({ status: "uploading" });
      const fileResponse = await fetch(blob.url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download exported design (${fileResponse.status})`);
      }
      const arrayBuffer = await fileResponse.arrayBuffer();
      const dataBase64 = arrayBufferToBase64(arrayBuffer);

      const uploadResponse = await fetch(`${BACKEND_HOST}/api/canva-app/designs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CanvaCodeCraft-Secret": CANVA_APP_SHARED_SECRET,
        },
        body: JSON.stringify({
          canvaDesignId: `${Date.now()}`,
          name,
          mimeType: "image/png",
          dataBase64,
        }),
      });

      if (!uploadResponse.ok) {
        const body = await uploadResponse.json().catch(() => ({}));
        throw new Error(body.message || `CanvaCodeCraft rejected the upload (${uploadResponse.status})`);
      }

      setState({ status: "success", name });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Something went wrong sending this design",
      });
    }
  };

  const isBusy = state.status === "exporting" || state.status === "uploading";

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          <FormattedMessage
            defaultMessage="Export the current design and send it straight to your CanvaCodeCraft element library."
            description="Explains what the Send to CanvaCodeCraft button does."
          />
        </Text>
        <Button variant="primary" onClick={sendToCanvaCodeCraft} disabled={isBusy} stretch loading={isBusy}>
          {state.status === "exporting"
            ? intl.formatMessage({ defaultMessage: "Exporting design…", description: "Button label while exporting" })
            : state.status === "uploading"
              ? intl.formatMessage({ defaultMessage: "Sending to CanvaCodeCraft…", description: "Button label while uploading" })
              : intl.formatMessage({ defaultMessage: "Send to CanvaCodeCraft", description: "Button label to export and send the design" })}
        </Button>
        {state.status === "success" && (
          <Box>
            <Alert tone="positive">
              {intl.formatMessage(
                { defaultMessage: '"{name}" was sent — it\'s now in your Library panel.', description: "Success message after sending a design" },
                { name: state.name },
              )}
            </Alert>
          </Box>
        )}
        {state.status === "error" && (
          <Box>
            <Alert tone="critical">{state.message}</Alert>
          </Box>
        )}
      </Rows>
    </div>
  );
};
