const supabase = require('../config/supabase');
const { uploadImage, deleteImage } = require('../services/uploadService');

// Helper to format menu item to match Mongoose response
const formatMenuItem = (item) => {
  if (!item) return null;
  return {
    _id: item.id,
    id: item.id,
    category: item.category,
    itemName: item.item_name,
    description: item.description,
    price: parseFloat(item.price),
    image: item.image,
    isAvailable: item.is_available,
    isFeatured: item.is_featured,
    createdAt: item.created_at
  };
};

/**
 * @desc    Get all menu items (with filtering support)
 * @route   GET /api/menu
 * @access  Public
 */
const getMenuItems = async (req, res, next) => {
  try {
    const { category, isFeatured, isAvailable } = req.query;
    
    let query = supabase.from('menu').select('*');

    if (category) {
      query = query.eq('category', category);
    }
    if (isFeatured !== undefined) {
      query = query.eq('is_featured', isFeatured === 'true');
    }
    if (isAvailable !== undefined) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    // Sort by category first, then name
    query = query.order('category', { ascending: true }).order('item_name', { ascending: true });

    const { data: items, error } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully',
      data: items.map(formatMenuItem)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single menu item by ID
 * @route   GET /api/menu/:id
 * @access  Public
 */
const getMenuItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { data: item, error } = await supabase
      .from('menu')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
        errors: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item retrieved successfully',
      data: formatMenuItem(item)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create menu item
 * @route   POST /api/menu
 * @access  Private
 */
const createMenuItem = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a menu item image file',
        errors: [{ field: 'image', message: 'Image file is required' }]
      });
    }

    const imageUrl = await uploadImage(req.file);

    const { category, itemName, description, price, isAvailable, isFeatured } = req.body;

    const { data: item, error } = await supabase
      .from('menu')
      .insert([
        {
          category,
          item_name: itemName,
          description,
          price: parseFloat(price),
          image: imageUrl,
          is_available: isAvailable !== undefined ? isAvailable === 'true' || isAvailable === true : true,
          is_featured: isFeatured !== undefined ? isFeatured === 'true' || isFeatured === true : false
        }
      ])
      .select()
      .single();

    if (error) {
      await deleteImage(imageUrl);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: formatMenuItem(item)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update menu item
 * @route   PUT /api/menu/:id
 * @access  Private
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch existing menu item
    const { data: item, error: fetchError } = await supabase
      .from('menu')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!item) {
      if (req.file) {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
        errors: []
      });
    }

    const { category, itemName, description, price, isAvailable, isFeatured } = req.body;
    let imageUrl = item.image;

    if (req.file) {
      imageUrl = await uploadImage(req.file);
      await deleteImage(item.image);
    }

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (itemName !== undefined) updateData.item_name = itemName;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (isAvailable !== undefined) updateData.is_available = isAvailable === 'true' || isAvailable === true;
    if (isFeatured !== undefined) updateData.is_featured = isFeatured === 'true' || isFeatured === true;
    updateData.image = imageUrl;

    const { data: updatedItem, error: updateError } = await supabase
      .from('menu')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: formatMenuItem(updatedItem)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete menu item
 * @route   DELETE /api/menu/:id
 * @access  Private
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: item, error: fetchError } = await supabase
      .from('menu')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
        errors: []
      });
    }

    // Delete image from storage
    await deleteImage(item.image);

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('menu')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
