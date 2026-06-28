const supabase = require('../config/supabase');
const { uploadImage, deleteImage } = require('../services/uploadService');

/**
 * @desc    Get all banners
 * @route   GET /api/banner
 * @access  Public
 */
const getBanners = async (req, res, next) => {
  try {
    const { data: banners, error } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    // Map database properties (e.g. display_order) to match Mongoose camelCase if needed,
    // but the request specifies to keep the same database structures.
    // Let's return the data as-is, since the schema has snake_case fields.
    // Wait, the client expects the same API responses as before!
    // Before, the Mongoose model was: title, subtitle, image, displayOrder.
    // Now, the table columns are: title, subtitle, image, display_order.
    // If the frontend expects displayOrder, we must map it!
    // Yes! Let's map display_order to displayOrder, and created_at to createdAt,
    // so the API response remains 100% IDENTICAL to what was returned before!
    // "The migration should require no changes to the frontend because all API endpoints and response formats must remain the same."
    // This is a CRITICAL detail! Let's map all fields to camelCase in the responses!

    const formattedBanners = banners.map(banner => ({
      _id: banner.id, // Mongoose returned _id, let's map id to _id too to keep it compatible!
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      ctaText: banner.cta_text,
      ctaLink: banner.cta_link,
      displayOrder: banner.display_order,
      createdAt: banner.created_at
    }));

    res.status(200).json({
      success: true,
      message: 'Banners retrieved successfully',
      data: formattedBanners
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a banner
 * @route   POST /api/banner
 * @access  Private
 */
const createBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a banner image file',
        errors: [{ field: 'image', message: 'Image file is required' }]
      });
    }

    // Upload image
    const imageUrl = await uploadImage(req.file);

    const { title, subtitle, ctaText, ctaLink, displayOrder } = req.body;

    const { data: banner, error } = await supabase
      .from('banners')
      .insert([
        {
          title,
          subtitle,
          image: imageUrl,
          cta_text: ctaText || 'View Menu',
          cta_link: ctaLink || '#menu',
          display_order: displayOrder !== undefined ? parseInt(displayOrder, 10) : 0
        }
      ])
      .select()
      .single();

    if (error) {
      // Cleanup uploaded image if database insert fails
      await deleteImage(imageUrl);
      throw error;
    }

    const formattedBanner = {
      _id: banner.id,
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image,
      ctaText: banner.cta_text,
      ctaLink: banner.cta_link,
      displayOrder: banner.display_order,
      createdAt: banner.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: formattedBanner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a banner
 * @route   PUT /api/banner/:id
 * @access  Private
 */
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch existing banner
    const { data: banner, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!banner) {
      if (req.file) {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
        errors: []
      });
    }

    const { title, subtitle, ctaText, ctaLink, displayOrder } = req.body;
    let imageUrl = banner.image;

    if (req.file) {
      imageUrl = await uploadImage(req.file);
      await deleteImage(banner.image);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (ctaText !== undefined) updateData.cta_text = ctaText;
    if (ctaLink !== undefined) updateData.cta_link = ctaLink;
    if (displayOrder !== undefined) updateData.display_order = parseInt(displayOrder, 10);
    updateData.image = imageUrl;

    const { data: updatedBanner, error: updateError } = await supabase
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const formattedBanner = {
      _id: updatedBanner.id,
      id: updatedBanner.id,
      title: updatedBanner.title,
      subtitle: updatedBanner.subtitle,
      image: updatedBanner.image,
      ctaText: updatedBanner.cta_text,
      ctaLink: updatedBanner.cta_link,
      displayOrder: updatedBanner.display_order,
      createdAt: updatedBanner.created_at
    };

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: formattedBanner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a banner
 * @route   DELETE /api/banner/:id
 * @access  Private
 */
const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch existing banner to get image URL
    const { data: banner, error: fetchError } = await supabase
      .from('banners')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
        errors: []
      });
    }

    // Delete image from storage
    await deleteImage(banner.image);

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('banners')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner
};
