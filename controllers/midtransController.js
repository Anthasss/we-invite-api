import midtransClient from "midtrans-client";
import prisma from "../lib/prisma.js";

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// Create a new transaction
export const createTransaction = async (req, res) => {
  try {
    const { orderId, productId, userId, weddingInfo } = req.body;

    // Validate required fields
    if (!orderId || !productId || !userId) {
      return res.status(400).json({
        error: "Missing required fields: orderId, productId, userId",
      });
    }

    // Get product details to calculate amount
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Prepare Midtrans transaction parameters
    const parameters = {
      transaction_details: {
        order_id: orderId,
        gross_amount: product.price,
      },
      customer_details: {
        first_name: user.name || "Guest",
      },
      item_details: [
        {
          id: product.id,
          price: product.price,
          quantity: 1,
          name: product.name,
        },
      ],
    };

    // Create transaction with Midtrans
    const transaction = await snap.createTransaction(parameters);

    // Create order in database
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId,
        productId,
        status: "pending",
        weddingInfo: weddingInfo || {},
      },
      include: {
        product: true,
        user: true,
      },
    });

    res.status(201).json({
      transaction,
      order,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      error: "Failed to create transaction",
      details: error.message,
    });
  }
};

// Handle Midtrans notification/webhook
export const handleNotification = async (req, res) => {
  try {
    const notification = req.body;

    // Verify notification from Midtrans
    const statusResponse = await snap.transaction.notification(notification);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let orderStatus = "pending";

    // Determine order status based on transaction status
    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") {
        orderStatus = "diterima";
      }
    } else if (transactionStatus === "settlement") {
      orderStatus = "diterima";
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      orderStatus = "dibatalkan";
    } else if (transactionStatus === "pending") {
      orderStatus = "pending";
    }

    // Update order status in database
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus },
      include: {
        product: true,
        user: true,
      },
    });

    res.json({
      message: "Notification handled successfully",
      order,
    });
  } catch (error) {
    console.error("Error handling notification:", error);
    res.status(500).json({
      error: "Failed to handle notification",
      details: error.message,
    });
  }
};

// Get transaction status
export const getTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get status from Midtrans
    const statusResponse = await snap.transaction.status(orderId);

    // Get order from database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json({
      midtransStatus: statusResponse,
      order,
    });
  } catch (error) {
    console.error("Error getting transaction status:", error);
    res.status(500).json({
      error: "Failed to get transaction status",
      details: error.message,
    });
  }
};