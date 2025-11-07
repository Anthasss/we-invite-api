import express from "express";
import multer from "multer";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// POST /api/orders - Create a new order
router.post("/", upload.array("images", 9), createOrder);

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
