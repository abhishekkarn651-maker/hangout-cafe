const supabase = require('../config/supabase');
const { uploadImage, deleteImage } = require('../services/uploadService');

const formatGalleryItem = (item) => {
  if (!item) return null;
  return {
    _id: item.id,
    id: item.id,
    image: item.image,
    caption: item.caption,
    createdAt: item.created_at
  };
};

/**
 * @desc    Get all gallery images
 * @route   GET /api/gallery
 * @access  Public
 */
const getGalleryItems = async (req, res, next) => {
  try {
    const { data: items, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Gallery images retrieved successfully',
      data: items.map(formatGalleryItem)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create/Upload a gallery image
 * @route   POST /api/gallery
 * @access  Private
 */
const createGalleryItem = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a gallery image file',
        errors: [{ field: 'image', message: 'Image file is required' }]
      });
    }

    const imageUrl = await uploadImage(req.file);
    const { caption } = req.body;

    const { data: item, error } = await supabase
      .from('gallery')
      .insert([
        {
          image: imageUrl,
          caption: caption || ''
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
      message: 'Gallery image uploaded successfully',
      data: formatGalleryItem(item)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete gallery image
 * @route   DELETE /api/gallery/:id
 * @access  Private
 */
const deleteGalleryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: item, error: fetchError } = await supabase
      .from('gallery')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found',
        errors: []
      });
    }

    // Delete image file from storage
    await deleteImage(item.image);

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('gallery')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: 'Gallery image deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGalleryItems,
  createGalleryItem,
  deleteGalleryItem
};
