const supabase = require('../config/supabase');
const { uploadImage, deleteImage } = require('../services/uploadService');

const formatOffer = (offer) => {
  if (!offer) return null;
  return {
    _id: offer.id,
    id: offer.id,
    title: offer.title,
    description: offer.description,
    image: offer.image,
    expiryDate: offer.expiry_date,
    isActive: offer.is_active,
    createdAt: offer.created_at
  };
};

/**
 * @desc    Get all offers
 * @route   GET /api/offers
 * @access  Public
 */
const getOffers = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    
    let query = supabase.from('offers').select('*');

    if (activeOnly === 'true') {
      query = query.eq('is_active', true);
      // Query filter: expiry_date is null OR expiry_date >= current time
      // In Supabase client syntax:
      // query = query.or('expiry_date.is.null,expiry_date.gte.' + new Date().toISOString());
      query = query.or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString()}`);
    }

    query = query.order('expiry_date', { ascending: true, nullsFirst: false });

    const { data: offers, error } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Offers retrieved successfully',
      data: offers.map(formatOffer)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create an offer
 * @route   POST /api/offers
 * @access  Private
 */
const createOffer = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an offer image file',
        errors: [{ field: 'image', message: 'Image file is required' }]
      });
    }

    const imageUrl = await uploadImage(req.file);
    const { title, description, expiryDate, isActive } = req.body;

    const { data: offer, error } = await supabase
      .from('offers')
      .insert([
        {
          title,
          description,
          image: imageUrl,
          expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
          is_active: isActive !== undefined ? isActive === 'true' || isActive === true : true
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
      message: 'Offer created successfully',
      data: formatOffer(offer)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an offer
 * @route   PUT /api/offers/:id
 * @access  Private
 */
const updateOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch existing offer
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!offer) {
      if (req.file) {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      }
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
        errors: []
      });
    }

    const { title, description, expiryDate, isActive } = req.body;
    let imageUrl = offer.image;

    if (req.file) {
      imageUrl = await uploadImage(req.file);
      await deleteImage(offer.image);
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (expiryDate !== undefined) updateData.expiry_date = expiryDate ? new Date(expiryDate).toISOString() : null;
    if (isActive !== undefined) updateData.is_active = isActive === 'true' || isActive === true;
    updateData.image = imageUrl;

    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      data: formatOffer(updatedOffer)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an offer
 * @route   DELETE /api/offers/:id
 * @access  Private
 */
const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
        errors: []
      });
    }

    // Delete image from storage
    await deleteImage(offer.image);

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer
};
