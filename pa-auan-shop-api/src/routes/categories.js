import { Router } from "express";
import { query } from "../db.js";

const router = Router();

// GET /api/categories
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT id, label FROM categories ORDER BY id");
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
