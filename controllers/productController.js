import prisma from '../lib/prisma.js';
import { uploadToSupabase, uploadMultipleToSupabase, deleteFromSupabase } from '../lib/uploadToSupabase.js';

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, price, tags } = req.body;
    const files = req.files;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, price' 
      });
    }

    // Validate thumbnail image is provided
    if (!files || !files.thumbnail || files.thumbnail.length === 0) {
      return res.status(400).json({ 
        error: 'Thumbnail image is required' 
      });
    }

    // Validate gallery images count (max 5)
    if (files.gallery && files.gallery.length > 5) {
      return res.status(400).json({ 
        error: 'Maximum 5 gallery images allowed' 
      });
    }

    // Upload thumbnail image
    const thumbnailUrl = await uploadToSupabase(
      files.thumbnail[0].buffer,
      files.thumbnail[0].originalname,
      'products',
      'thumbnails'
    );

    // Upload gallery images if provided
    let galleryUrls = [];
    if (files.gallery && files.gallery.length > 0) {
      galleryUrls = await uploadMultipleToSupabase(
        files.gallery,
        'products',
        'gallery'
      );
    }

    // Parse tags if provided
    const normalizedTags = tags && tags.length > 0 
      ? (typeof tags === 'string' ? JSON.parse(tags) : tags)
          .map(tagName => tagName.trim().toLowerCase())
          .filter(tag => tag.length > 0)
      : [];

    // Create product with images and optional tags
    const product = await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        thumbnail: thumbnailUrl,
        galleryUrls: galleryUrls,
        tags: normalizedTags.length > 0 ? {
          connectOrCreate: normalizedTags.map(tagName => ({
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
    const { name, price, tags } = req.body;
    const files = req.files;

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

    // Handle thumbnail update
    if (files && files.thumbnail && files.thumbnail.length > 0) {
      // Delete old thumbnail from Supabase
      if (existingProduct.thumbnail) {
        try {
          await deleteFromSupabase(existingProduct.thumbnail, 'products');
        } catch (error) {
          console.error('Error deleting old thumbnail:', error);
        }
      }

      // Upload new thumbnail
      updateData.thumbnail = await uploadToSupabase(
        files.thumbnail[0].buffer,
        files.thumbnail[0].originalname,
        'products',
        'thumbnails'
      );
    }

    // Handle gallery update
    if (files && files.gallery) {
      // Validate gallery images count (max 5)
      if (files.gallery.length > 5) {
        return res.status(400).json({ 
          error: 'Maximum 5 gallery images allowed' 
        });
      }

      // Delete old gallery images from Supabase
      if (existingProduct.galleryUrls && existingProduct.galleryUrls.length > 0) {
        for (const imageUrl of existingProduct.galleryUrls) {
          try {
            await deleteFromSupabase(imageUrl, 'products');
          } catch (error) {
            console.error('Error deleting old gallery image:', error);
          }
        }
      }

      // Upload new gallery images
      updateData.galleryUrls = await uploadMultipleToSupabase(
        files.gallery,
        'products',
        'gallery'
      );
    }

    // Handle tags update if provided
    if (tags !== undefined) {
      // Normalize tags to lowercase for consistency
      const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      const normalizedTags = parsedTags
        .map(tagName => tagName.trim().toLowerCase())
        .filter(tag => tag.length > 0);
      
      // First, disconnect all existing tags
      updateData.tags = {
        set: [], // Remove all existing connections
        connectOrCreate: normalizedTags.map(tagName => ({
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

    // Delete thumbnail from Supabase Storage
    if (existingProduct.thumbnail) {
      try {
        await deleteFromSupabase(existingProduct.thumbnail, 'products');
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
    }

    // Delete gallery images from Supabase Storage
    if (existingProduct.galleryUrls && existingProduct.galleryUrls.length > 0) {
      for (const imageUrl of existingProduct.galleryUrls) {
        try {
          await deleteFromSupabase(imageUrl, 'products');
        } catch (error) {
          console.error('Error deleting gallery image:', error);
        }
      }
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
