const supabase = require('../config/supabase');
const { uploadImage, deleteImage } = require('../services/uploadService');

const formatAbout = (about) => {
  if (!about) return null;
  return {
    _id: about.id,
    id: about.id,
    description: about.description,
    image: about.image,
    updatedAt: about.updated_at
  };
};

/**
 * @desc    Get About details
 * @route   GET /api/about
 * @access  Public
 */
const getAbout = async (req, res, next) => {
  try {
    const { data: about, error } = await supabase
      .from('about')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'About details retrieved successfully',
      data: formatAbout(about)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update About details (Singleton)
 * @route   PUT /api/about
 * @access  Private
 */
const updateAbout = async (req, res, next) => {
  try {
    const { description } = req.body;

    // Check if about details exist
    const { data: existingAbout, error: fetchError } = await supabase
      .from('about')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existingAbout) {
      // Create scenario. Image is required.
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload an image for the About page',
          errors: [{ field: 'image', message: 'Image file is required' }]
        });
      }

      const imageUrl = await uploadImage(req.file);

      const { data: newAbout, error: insertError } = await supabase
        .from('about')
        .insert([
          {
            description,
            image: imageUrl
          }
        ])
        .select()
        .single();

      if (insertError) {
        await deleteImage(imageUrl);
        throw insertError;
      }

      return res.status(201).json({
        success: true,
        message: 'About details created successfully',
        data: formatAbout(newAbout)
      });
    }

    // Update scenario. Image is optional.
    let imageUrl = existingAbout.image;
    if (req.file) {
      imageUrl = await uploadImage(req.file);
      await deleteImage(existingAbout.image);
    }

    const { data: updatedAbout, error: updateError } = await supabase
      .from('about')
      .update({
        description,
        image: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingAbout.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'About details updated successfully',
      data: formatAbout(updatedAbout)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAbout,
  updateAbout
};
