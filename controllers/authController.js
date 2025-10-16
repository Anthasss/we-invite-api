import prisma from '../lib/prisma.js';

export const syncUser = async (req, res) => {
  try {
    const { sub } = req.body;

    // Validate required fields
    if (!sub) {
      return res.status(400).json({ 
        error: 'Missing required field: sub' 
      });
    }

    // Check if user exists, create if not (upsert)
    const user = await prisma.user.upsert({
      where: { id: sub },
      update: {}, // Don't update anything if user exists
      create: {
        id: sub,
        role: 'customer'
      }
    });

    res.json({ 
      user,
      isNewUser: user.role === 'customer'
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ 
      error: 'Failed to sync user',
      details: error.message 
    });
  }
};
