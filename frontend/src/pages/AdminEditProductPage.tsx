import {
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, errorMessage } from "../api/client";
import { useFeedback } from "../context/Feedback/FeedbackContext";
import StateMessage from "../Components/states/StateMessage";
import {
  CATEGORY_META,
  PRODUCT_CATEGORIES,
  product,
  ProductCategory,
} from "../types/product";

/**
 * The edit form. The backend has had PUT /admin/products/:id since the start,
 * but nothing in the UI ever called it — products could only be created and
 * retired.
 */
const AdminEditProductPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { showSuccess } = useFeedback();

  const [form, setForm] = useState({
    title: "",
    brand: "",
    description: "",
    category: "laptops" as ProductCategory,
    image: "",
    price: "",
    stock: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const p = await api.get<product>(`/admin/products/${productId}`);
        if (cancelled) return;
        setForm({
          title: p.title,
          brand: p.brand ?? "",
          description: p.description ?? "",
          category: p.category ?? "laptops",
          image: p.image,
          price: String(p.price),
          stock: String(p.stock),
        });
      } catch (err) {
        if (!cancelled)
          setLoadError(errorMessage(err, "Could not load product"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      await api.put(`/admin/products/${productId}`, {
        title: form.title.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        category: form.category,
        image: form.image.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      });
      showSuccess("Product updated");
      navigate("/admin/products/list");
    } catch (err) {
      setError(errorMessage(err, "Could not save changes"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 14, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="sm" sx={{ py: 14 }}>
        <StateMessage
          icon="⚠️"
          title="Could not load that product"
          description={loadError}
          actionLabel="Back to products"
          onAction={() => navigate("/admin/products/list")}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 12, md: 14 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Edit Product
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}
      >
        <TextField
          label="Title"
          value={form.title}
          onChange={(e) => set("title")(e.target.value)}
          required
        />
        <TextField
          label="Brand"
          value={form.brand}
          onChange={(e) => set("brand")(e.target.value)}
        />
        <TextField
          select
          label="Category"
          value={form.category}
          onChange={(e) => set("category")(e.target.value)}
        >
          {PRODUCT_CATEGORIES.map((value) => (
            <MenuItem key={value} value={value}>
              {CATEGORY_META[value].icon} {CATEGORY_META[value].label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          multiline
          minRows={3}
        />
        <TextField
          label="Image URL"
          value={form.image}
          onChange={(e) => set("image")(e.target.value)}
          required
        />
        <TextField
          label="Price"
          type="number"
          value={form.price}
          onChange={(e) => set("price")(e.target.value)}
          required
          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
        />
        <TextField
          label="Stock"
          type="number"
          value={form.stock}
          onChange={(e) => set("stock")(e.target.value)}
          required
          InputProps={{ inputProps: { min: 0, step: 1 } }}
        />

        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/products/list")}
          >
            Cancel
          </Button>
        </Stack>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default AdminEditProductPage;
