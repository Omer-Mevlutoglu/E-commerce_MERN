import {
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "../api/client";
import { useFeedback } from "../context/Feedback/FeedbackContext";
import {
  CATEGORY_META,
  PRODUCT_CATEGORIES,
  ProductCategory,
} from "../types/product";

const AdminAddProductPage = () => {
  const titleRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ProductCategory>("laptops");
  const navigate = useNavigate();
  const { showSuccess } = useFeedback();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = titleRef.current?.value.trim();
    const image = imageRef.current?.value.trim();
    const price = Number(priceRef.current?.value);
    const stock = Number(stockRef.current?.value);

    if (!title || !image || isNaN(price) || isNaN(stock)) {
      setError("All fields are required and must be valid.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await api.post("/admin/products", {
        title,
        brand: brandRef.current?.value.trim() ?? "",
        description: descriptionRef.current?.value.trim() ?? "",
        category,
        image,
        price,
        stock,
      });
      showSuccess("Product created");
      navigate("/admin/products/list");
    } catch (err) {
      setError(errorMessage(err, "Failed to add product"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 12, md: 14 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Add New Product
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}
      >
        <TextField inputRef={titleRef} label="Title" required />
        <TextField inputRef={brandRef} label="Brand" />
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
        >
          {PRODUCT_CATEGORIES.map((value) => (
            <MenuItem key={value} value={value}>
              {CATEGORY_META[value].icon} {CATEGORY_META[value].label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          inputRef={descriptionRef}
          label="Description"
          multiline
          minRows={3}
        />
        <TextField inputRef={imageRef} label="Image URL" required />
        <TextField
          inputRef={priceRef}
          label="Price"
          type="number"
          required
          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
        />
        <TextField
          inputRef={stockRef}
          label="Stock"
          type="number"
          required
          InputProps={{ inputProps: { min: 0, step: 1 } }}
        />

        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? "Creating…" : "Create Product"}
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

export default AdminAddProductPage;
