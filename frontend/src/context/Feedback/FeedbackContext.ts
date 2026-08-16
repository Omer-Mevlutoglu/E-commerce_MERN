import { createContext, useContext } from "react";

export type FeedbackSeverity = "success" | "error" | "info" | "warning";

interface FeedbackContextType {
  notify: (message: string, severity?: FeedbackSeverity) => void;
  /** Kept as a distinct name because it reads better at call sites. */
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

export const FeedbackContext = createContext<FeedbackContextType>({
  notify: () => {},
  showError: () => {},
  showSuccess: () => {},
});

export const useFeedback = () => useContext(FeedbackContext);
