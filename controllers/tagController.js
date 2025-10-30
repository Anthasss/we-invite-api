import prisma from '../lib/prisma.js';

// Create tags (accepts comma-separated string)
export const createTags = async (req, res) => {
  try {
    const { tags } = req.body;

    // Validate required field
    if (!tags || typeof tags !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid required field: tags (must be a string)' 
      });
    }

    // Split the string by commas and process each tag
    const tagNames = tags
      .split(',')
      .map(tag => tag.trim().toLowerCase()) // Trim whitespace and convert to lowercase
      .filter(tag => tag.length > 0); // Remove empty strings

    if (tagNames.length === 0) {
      return res.status(400).json({ 
        error: 'No valid tags provided' 
      });
    }

    // Remove duplicates from the input
    const uniqueTagNames = [...new Set(tagNames)];

    // Upsert each tag (create if doesn't exist, skip if exists)
    const createdTags = await Promise.all(
      uniqueTagNames.map(tagName =>
        prisma.tag.upsert({
          where: { name: tagName },
          update: {}, // Don't update if exists
          create: { name: tagName }
        })
      )
    );

    res.status(201).json({
      message: `Successfully processed ${uniqueTagNames.length} tag(s)`,
      tags: createdTags
    });
  } catch (error) {
    console.error('Error creating tags:', error);
    res.status(500).json({ 
      error: 'Failed to create tags',
      details: error.message 
    });
  }
};

// Get all tags
export const getAllTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tags',
      details: error.message 
    });
  }
};

// Get a single tag by ID
export const getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true
          }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    if (!tag) {
      return res.status(404).json({ 
        error: 'Tag not found' 
      });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tag',
      details: error.message 
    });
  }
};

// Update a tag
export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required field
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid required field: name (must be a string)' 
      });
    }

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return res.status(404).json({ 
        error: 'Tag not found' 
      });
    }

    // Convert to lowercase
    const normalizedName = name.trim().toLowerCase();

    if (normalizedName.length === 0) {
      return res.status(400).json({ 
        error: 'Tag name cannot be empty' 
      });
    }

    // Check if another tag with the same name already exists
    const duplicateTag = await prisma.tag.findUnique({
      where: { name: normalizedName }
    });

    if (duplicateTag && duplicateTag.id !== id) {
      return res.status(400).json({ 
        error: 'A tag with this name already exists' 
      });
    }

    // Update the tag
    const tag = await prisma.tag.update({
      where: { id },
      data: { name: normalizedName },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ 
      error: 'Failed to update tag',
      details: error.message 
    });
  }
};

// Delete a tag
export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    if (!existingTag) {
      return res.status(404).json({ 
        error: 'Tag not found' 
      });
    }

    // Delete the tag (will be disconnected from products automatically)
    await prisma.tag.delete({
      where: { id }
    });

    res.json({ 
      message: 'Tag deleted successfully',
      id,
      productsAffected: existingTag._count.products
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ 
      error: 'Failed to delete tag',
      details: error.message 
    });
  }
};
