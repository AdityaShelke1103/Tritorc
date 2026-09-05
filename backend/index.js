import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./Config/db.js";
import scanRoutes from "./Routes/scanRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/scan", scanRoutes);

// Local development only
if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;