import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../Components/ProductCard";
import ProductCardSkeleton from "../Components/states/ProductCardSkeleton";
import StateMessage from "../Components/states/StateMessage";
import { api, errorMessage } from "../api/client";
import {
  CATEGORY_META,
  Paginated,
  PRODUCT_CATEGORIES,
  product,
  ProductCategory,
  ProductSort,
  SORT_OPTIONS,
} from "../types/product";
import { useDebounced } from "../hooks/useDebounced";

const PAGE_SIZE = 12;

/**
 * The full catalogue: search, category filter, sort and pagination.
 *
 * All four live in the URL rather than component state, so a filtered view can
 * be linked, bookmarked and navigated back to — the category tiles on the home
 * page just link here with ?category=.
 */
const ProductsPage = () => {
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") ?? 1);
  const category = (params.get("category") as ProductCategory) || "";
  const sort = (params.get("sort") as ProductSort) || "newest";
  const search = params.get("search") ?? "";

  // Local so typing feels immediate; the URL only updates once typing settles.
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounced(searchInput, 400);

  const [data, setData] = useState<Paginated<product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Keep the box in step when the URL changes from elsewhere (back button,
  // a category tile), without clobbering what the user is mid-way through typing.
  useEffect(() => {
    setSearchInput((current) => (current === search ? current : search));
  }, [search]);

  useEffect(() => {
    if (debouncedSearch === search) return;

    const next = new URLSearchParams(params);
    if (debouncedSearch) next.set("search", debouncedSearch);
    else next.delete("search");
    next.delete("page"); // a new search starts at the first page
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useMemo(() => {
    const q = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort,
    });
    if (category) q.set("category", category);
    if (search) q.set("search", search);
    return q.toString();
  }, [page, sort, category, search]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    (async () => {
      try {
        const result = await api.get<Paginated<product>>(
          `/products?${query}`,
          { auth: false }
        );
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, "Could not load products"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    });
    setParams(next);
  };

  const clearFilters = () => setParams(new URLSearchParams());
  const hasFilters = Boolean(category || search);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 12, md: 14 }, minHeight: "80vh" }}>
      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
        All Products
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        {data
          ? `${data.total} product${data.total === 1 ? "" : "s"} available`
          : "Browse the full catalogue"}
      </Typography>

      {/* Controls */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
        alignItems={{ md: "center" }}
      >
        <TextField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products"
          label="Search"
          size="small"
          sx={{ maxWidth: { md: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Sort by"
          value={sort}
          onChange={(e) => update({ sort: e.target.value, page: null })}
          sx={{ maxWidth: { md: 220 } }}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: "wrap", gap: 1 }}>
        <Chip
          label="All"
          color={category ? "default" : "primary"}
          onClick={() => update({ category: null, page: null })}
        />
        {PRODUCT_CATEGORIES.map((value) => (
          <Chip
            key={value}
            label={`${CATEGORY_META[value].icon} ${CATEGORY_META[value].label}`}
            color={category === value ? "primary" : "default"}
            onClick={() => update({ category: value, page: null })}
          />
        ))}
      </Stack>

      {/* Results */}
      {isLoading ? (
        <Grid container spacing={4}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <ProductCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : error ? (
        <StateMessage
          icon="⚠️"
          title="Something went wrong"
          description={error}
          actionLabel="Try again"
          onAction={() => update({ _retry: String(Date.now()) })}
        />
      ) : data && data.items.length === 0 ? (
        <StateMessage
          icon="🔍"
          title="No products match your search"
          description={
            hasFilters
              ? "Try a different search term, or clear the filters to see everything."
              : "The catalogue is empty right now. Please check back soon."
          }
          actionLabel={hasFilters ? "Clear filters" : undefined}
          onAction={hasFilters ? clearFilters : undefined}
        />
      ) : (
        <>
          <Grid container spacing={4}>
            {data?.items.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p._id}>
                <ProductCard {...p} />
              </Grid>
            ))}
          </Grid>

          {data && data.totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <Pagination
                count={data.totalPages}
                page={data.page}
                color="primary"
                onChange={(_, value) => {
                  update({ page: String(value) });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ProductsPage;
