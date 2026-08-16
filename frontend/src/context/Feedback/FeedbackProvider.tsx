import { FC, PropsWithChildren, useCallback, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { FeedbackContext, FeedbackSeverity } from "./FeedbackContext";

/**
 * One snackbar for the whole app.
 *
 * Previously the only toast lived in CartProvider and could only report
 * failures, so a successful action gave no feedback at all — adding to the cart
 * looked identical to nothing happening.
 */
const FeedbackProvider: FC<PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<FeedbackSeverity>("info");

  const notify = useCallback(
    (text: string, level: FeedbackSeverity = "info") => {
      setMessage(text);
      setSeverity(level);
      setOpen(true);
    },
    []
  );

  const showError = useCallback(
    (text: string) => notify(text, "error"),
    [notify]
  );

  const showSuccess = useCallback(
    (text: string) => notify(text, "success"),
    [notify]
  );

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <FeedbackContext.Provider value={{ notify, showError, showSuccess }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={severity === "error" ? 5000 : 3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
};

export default FeedbackProvider;
