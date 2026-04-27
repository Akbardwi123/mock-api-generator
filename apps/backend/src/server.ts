import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // Frontend uses 3000

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "MockNest Backend Engine is running!" });
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
