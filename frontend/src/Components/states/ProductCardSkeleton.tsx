import { Card, CardContent, Skeleton } from "@mui/material";

/**
 * Mirrors ProductCard's proportions so the grid does not jump when real cards
 * replace it. Pages previously rendered nothing at all while loading.
 */
export default function ProductCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <Skeleton variant="rectangular" height={280} animation="wave" />
      <CardContent sx={{ px: 2.5, pt: 2, pb: 2.5 }}>
        <Skeleton width="85%" height={28} />
        <Skeleton width="60%" height={28} />
        <Skeleton width="40%" height={32} sx={{ mt: 1 }} />
        <Skeleton
          variant="rectangular"
          height={44}
          sx={{ mt: 2, borderRadius: 2 }}
        />
      </CardContent>
    </Card>
  );
}
