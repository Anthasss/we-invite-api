import prisma from '../lib/prisma.js';

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, price, imageUrl, tags } = req.body;

    // Validate required fields
    if (!name || !price || !imageUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, price, imageUrl' 
      });
    }

    // Create product with optional tags
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        imageUrl,
        tags: tags && tags.length > 0 ? {
          connectOrCreate: tags.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName }
          }))
        } : undefined
      },
      include: {
        tags: true
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: error.message 
    });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    const { tag } = req.query;

    // Build filter based on query parameters
    const filter = tag ? {
      tags: {
        some: {
          name: tag
        }
      }
    } : {};

    const products = await prisma.product.findMany({
      where: filter,
      include: {
        tags: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error.message 
    });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        tags: true,
        orders: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: error.message 
    });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, imageUrl, tags } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Build update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Handle tags update if provided
    if (tags !== undefined) {
      // First, disconnect all existing tags
      updateData.tags = {
        set: [], // Remove all existing connections
        connectOrCreate: tags.map(tagName => ({
          where: { name: tagName },
          create: { name: tagName }
        }))
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        tags: true
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: error.message 
    });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    // Delete the product (orders will be cascade deleted)
    await prisma.product.delete({
      where: { id }
    });

    res.json({ 
      message: 'Product deleted successfully',
      id 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Failed to delete product',
      details: error.message 
    });
  }
};
