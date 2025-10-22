import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// POST /api/orders - Create a new order
router.post("/", createOrder);

// GET /api/orders - Get all orders (supports ?userId=xxx and ?status=xxx query)
router.get("/", getAllOrders);

// GET /api/orders/user/:userId - Get orders by user ID
router.get("/user/:userId", getOrdersByUserId);

// GET /api/orders/:id - Get a single order by ID
router.get("/:id", getOrderById);

// PUT /api/orders/:id - Update an order
router.put("/:id", updateOrder);

// DELETE /api/orders/:id - Delete an order
router.delete("/:id", deleteOrder);

export default router;
