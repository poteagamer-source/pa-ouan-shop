/** API สต๊อกสินค้าและท็อปปิ้ง: add/update/adjust/delete และคำนวณสถานะ low */
import { Router } from "express";
import { query } from "../db.js";
import { publishUpdate } from "../realtime.js";

const router = Router();
const validQty = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;
const validUnit = (value) => typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 30;

const mapProductStock = (row) => ({
  id: row.id, name: row.name, price: Number(row.price), category: row.category_id, image: row.image,
  bestseller: row.bestseller, recommended: row.recommended, stockQty: row.stock_qty,
  unit: row.unit, active: row.active, status: row.stock_qty <= row.low_at ? "low" : "enough",
});
const mapToppingStock = (row) => ({
  id: row.id, name: row.name, price: Number(row.price), image: row.image, tier: row.tier,
  stockQty: row.stock_qty, unit: row.unit, active: row.stock_active,
  status: row.stock_qty <= row.low_at ? "low" : "enough",
});

async function productById(id) {
  const { rows } = await query(`SELECT p.*, s.stock_qty, s.unit, s.low_at FROM products p JOIN stock s ON s.product_id=p.id WHERE p.id=$1`, [id]);
  return rows[0] ? mapProductStock(rows[0]) : null;
}
async function toppingById(id) {
  const { rows } = await query(`SELECT t.*, s.stock_qty, s.unit, s.low_at, s.active AS stock_active FROM toppings t JOIN topping_stock s ON s.topping_id=t.id WHERE t.id=$1`, [id]);
  return rows[0] ? mapToppingStock(rows[0]) : null;
}

router.get("/", async (_req, res, next) => {
  try { const { rows } = await query(`SELECT p.*, s.stock_qty, s.unit, s.low_at FROM products p JOIN stock s ON s.product_id=p.id ORDER BY p.category_id,p.id`); res.json(rows.map(mapProductStock)); }
  catch (error) { next(error); }
});

router.post("/:productId", async (req, res, next) => {
  try {
    const qty = req.body?.stockQty ?? 0; const unit = String(req.body?.unit ?? "ถ้วย").trim();
    if (!validQty(qty) || !validUnit(unit)) return res.status(400).json({ error: "จำนวนหรือหน่วยไม่ถูกต้อง" });
    const result = await query(`INSERT INTO stock(product_id,stock_qty,unit) SELECT id,$2,$3 FROM products WHERE id=$1 ON CONFLICT(product_id) DO NOTHING RETURNING product_id`, [req.params.productId, Number(qty), unit]);
    if (!result.rowCount) return res.status(409).json({ error: "สินค้านี้อยู่ในสต๊อกแล้ว หรือไม่พบสินค้า" });
    publishUpdate("stock", "created", req.params.productId); res.status(201).json(await productById(req.params.productId));
  } catch (error) { next(error); }
});

router.put("/:productId", async (req, res, next) => {
  try {
    const { stockQty, unit, active } = req.body;
    if (stockQty !== undefined && !validQty(stockQty)) return res.status(400).json({ error: "จำนวนสต๊อกต้องเป็นเลขจำนวนเต็มตั้งแต่ 0 ขึ้นไป" });
    if (unit !== undefined && !validUnit(unit)) return res.status(400).json({ error: "หน่วยสินค้าไม่ถูกต้อง" });
    if (stockQty !== undefined || unit !== undefined) await query(`UPDATE stock SET stock_qty=COALESCE($2,stock_qty),unit=COALESCE($3,unit),updated_at=now() WHERE product_id=$1`, [req.params.productId, stockQty, unit?.trim()]);
    if (active !== undefined) await query(`UPDATE products SET active=$2 WHERE id=$1`, [req.params.productId, Boolean(active)]);
    const item = await productById(req.params.productId); if (!item) return res.status(404).json({ error: "ไม่พบสินค้าในสต๊อก" });
    publishUpdate("stock", "updated", req.params.productId); res.json(item);
  } catch (error) { next(error); }
});

router.patch("/:productId/adjust", async (req, res, next) => {
  try {
    const delta=Number(req.body?.delta); if (!Number.isInteger(delta)||delta===0||Math.abs(delta)>10000) return res.status(400).json({ error: "จำนวนที่เพิ่มหรือลดไม่ถูกต้อง" });
    const result=await query(`UPDATE stock SET stock_qty=GREATEST(stock_qty+$2,0),updated_at=now() WHERE product_id=$1 RETURNING product_id`,[req.params.productId,delta]);
    if (!result.rowCount) return res.status(404).json({ error: "ไม่พบสินค้าในสต๊อก" }); publishUpdate("stock","updated",req.params.productId); res.json(await productById(req.params.productId));
  } catch(error){next(error);}
});

router.delete("/:productId", async (req,res,next)=>{try{const result=await query(`DELETE FROM stock WHERE product_id=$1`,[req.params.productId]);if(!result.rowCount)return res.status(404).json({error:"ไม่พบสินค้าในสต๊อก"});publishUpdate("stock","deleted",req.params.productId);res.status(204).end();}catch(error){next(error);}});

router.get("/toppings/all", async (_req,res,next)=>{try{const {rows}=await query(`SELECT t.*,s.stock_qty,s.unit,s.low_at,s.active AS stock_active FROM toppings t JOIN topping_stock s ON s.topping_id=t.id ORDER BY t.tier,t.id`);res.json(rows.map(mapToppingStock));}catch(error){next(error);}});
router.post("/toppings/:id",async(req,res,next)=>{try{const qty=req.body?.stockQty??0,unit=String(req.body?.unit??"หน่วย").trim();if(!validQty(qty)||!validUnit(unit))return res.status(400).json({error:"จำนวนหรือหน่วยไม่ถูกต้อง"});const result=await query(`INSERT INTO topping_stock(topping_id,stock_qty,unit) SELECT id,$2,$3 FROM toppings WHERE id=$1 ON CONFLICT(topping_id) DO NOTHING RETURNING topping_id`,[req.params.id,Number(qty),unit]);if(!result.rowCount)return res.status(409).json({error:"ท็อปปิ้งนี้อยู่ในสต๊อกแล้ว หรือไม่พบรายการ"});publishUpdate("stock","created",req.params.id);res.status(201).json(await toppingById(req.params.id));}catch(error){next(error);}});
router.put("/toppings/:id",async(req,res,next)=>{try{const{stockQty,unit,active}=req.body;if(stockQty!==undefined&&!validQty(stockQty))return res.status(400).json({error:"จำนวนสต๊อกไม่ถูกต้อง"});if(unit!==undefined&&!validUnit(unit))return res.status(400).json({error:"หน่วยไม่ถูกต้อง"});await query(`UPDATE topping_stock SET stock_qty=COALESCE($2,stock_qty),unit=COALESCE($3,unit),active=COALESCE($4,active),updated_at=now() WHERE topping_id=$1`,[req.params.id,stockQty,unit?.trim(),active]);const item=await toppingById(req.params.id);if(!item)return res.status(404).json({error:"ไม่พบท็อปปิ้งในสต๊อก"});publishUpdate("stock","updated",req.params.id);res.json(item);}catch(error){next(error);}});
router.patch("/toppings/:id/adjust",async(req,res,next)=>{try{const delta=Number(req.body?.delta);if(!Number.isInteger(delta)||delta===0)return res.status(400).json({error:"จำนวนไม่ถูกต้อง"});const result=await query(`UPDATE topping_stock SET stock_qty=GREATEST(stock_qty+$2,0),updated_at=now() WHERE topping_id=$1 RETURNING topping_id`,[req.params.id,delta]);if(!result.rowCount)return res.status(404).json({error:"ไม่พบท็อปปิ้งในสต๊อก"});publishUpdate("stock","updated",req.params.id);res.json(await toppingById(req.params.id));}catch(error){next(error);}});
router.delete("/toppings/:id",async(req,res,next)=>{try{const result=await query(`DELETE FROM topping_stock WHERE topping_id=$1`,[req.params.id]);if(!result.rowCount)return res.status(404).json({error:"ไม่พบท็อปปิ้งในสต๊อก"});publishUpdate("stock","deleted",req.params.id);res.status(204).end();}catch(error){next(error);}});

export default router;
