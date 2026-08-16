import { Box, Button, Typography } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * The empty / error / not-found panel, shared so every page says "nothing
 * here" the same way and always offers a way forward.
 */
export default function StateMessage({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  return (
    <Box
      role="status"
      sx={{
        textAlign: "center",
        py: { xs: 6, md: 10 },
        px: 3,
        border: "2px dashed",
        borderColor: "divider",
        borderRadius: 4,
        backgroundColor: "background.paper",
      }}
    >
      {icon && (
        <Box sx={{ fontSize: "3rem", mb: 2, lineHeight: 1 }}>{icon}</Box>
      )}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 460, mx: "auto", mb: 3 }}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{ borderRadius: 20, px: 4, fontWeight: 600 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
