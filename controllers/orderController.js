import prisma from "../lib/prisma.js";

// Create a new order with snapToken support
export const createOrder = async (req, res) => {
  try {
    const { orderId, userId, productId, weddingInfo, snapToken } = req.body;

    // Validate required fields
    if (!orderId || !userId || !productId) {
      return res.status(400).json({
        error: "Missing required fields: orderId, userId, productId",
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId,
        productId,
        status: "pending",
        weddingInfo: weddingInfo || {},
        snapToken: snapToken || null,
      },
      include: {
        product: true,
        user: true,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.message,
    });
  }
};

// Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const { userId, status } = req.query;

    // Build filter based on query parameters
    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const orders = await prisma.order.findMany({
      where: filter,
      include: {
        product: {
          include: {
            tags: true,
          },
        },
        user: true,
      },
      orderBy: {
        status: "asc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: error.message,
    });
  }
};

// Get a single order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            tags: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      error: "Failed to fetch order",
      details: error.message,
    });
  }
};

// Get orders by user ID
export const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Get all orders for this user
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            tags: true,
          },
        },
        user: true,
      },
      orderBy: {
        status: "asc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders by user ID:", error);
    res.status(500).json({
      error: "Failed to fetch orders",
      details: error.message,
    });
  }
};

// Update an order
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, weddingInfo, snapToken } = req.body;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Build update data
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (weddingInfo !== undefined) updateData.weddingInfo = weddingInfo;
    if (snapToken !== undefined) updateData.snapToken = snapToken;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        product: {
          include: {
            tags: true,
          },
        },
        user: true,
      },
    });

    res.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      error: "Failed to update order",
      details: error.message,
    });
  }
};

// Delete an order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Delete the order
    await prisma.order.delete({
      where: { id },
    });

    res.json({
      message: "Order deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      error: "Failed to delete order",
      details: error.message,
    });
  }
};
