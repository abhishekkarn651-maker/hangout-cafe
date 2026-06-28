const supabase = require('../config/supabase');

const formatContact = (contact) => {
  if (!contact) return null;
  return {
    _id: contact.id,
    id: contact.id,
    address: contact.address,
    phone: contact.phone,
    email: contact.email,
    openingHours: contact.opening_hours,
    instagram: contact.instagram,
    facebook: contact.facebook,
    whatsapp: contact.whatsapp,
    googleMapsLink: contact.google_maps_link,
    updatedAt: contact.updated_at
  };
};

/**
 * @desc    Get Contact details
 * @route   GET /api/contact
 * @access  Public
 */
const getContact = async (req, res, next) => {
  try {
    const { data: contact, error } = await supabase
      .from('contact')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Contact details retrieved successfully',
      data: formatContact(contact)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update Contact details (Singleton)
 * @route   PUT /api/contact
 * @access  Private
 */
const updateContact = async (req, res, next) => {
  try {
    const {
      address,
      phone,
      email,
      openingHours,
      instagram,
      facebook,
      whatsapp,
      googleMapsLink
    } = req.body;

    // Check if contact details already exist
    const { data: existingContact, error: fetchError } = await supabase
      .from('contact')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existingContact) {
      // Create record
      const { data: newContact, error: insertError } = await supabase
        .from('contact')
        .insert([
          {
            address,
            phone,
            email,
            opening_hours: openingHours,
            instagram,
            facebook,
            whatsapp,
            google_maps_link: googleMapsLink
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      return res.status(201).json({
        success: true,
        message: 'Contact details created successfully',
        data: formatContact(newContact)
      });
    }

    // Update existing record
    const { data: updatedContact, error: updateError } = await supabase
      .from('contact')
      .update({
        address,
        phone,
        email,
        opening_hours: openingHours,
        instagram,
        facebook,
        whatsapp,
        google_maps_link: googleMapsLink,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingContact.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Contact details updated successfully',
      data: formatContact(updatedContact)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContact,
  updateContact
};
