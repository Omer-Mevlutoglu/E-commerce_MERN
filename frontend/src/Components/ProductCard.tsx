import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useCart } from "../context/Cart/CartContext";
interface props {
  _id: string;
  title: string;
  image: string;
  price: string;
}
export default function ProductCard({ _id, title, image, price }: props) {
  const { addItemToCart } = useCart();
  return (
    <Card>
      <CardMedia sx={{ height: 300 }} image={image} title={title} />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "20px" }}
        >
          $ {price}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          variant="contained"
          onClick={() => addItemToCart(_id)}
        >
          Add to Caart
        </Button>
      </CardActions>
    </Card>
  );
}
