const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = require('../config/supabase');

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@hangoutcafe.com';
    const password = process.env.ADMIN_PASSWORD || 'AdminHangoutPassword123';

    console.log(`Checking if admin account with email "${email}" already exists...`);

    // 1. Check if an admin with the same email exists
    const { data: existingAdmins, error: fetchError } = await supabase
      .from('admins')
      .select('id, email');

    if (fetchError) {
      throw new Error(`Failed to query admins table: ${fetchError.message}. Make sure you ran schema.sql on your Supabase project!`);
    }

    if (existingAdmins && existingAdmins.some(admin => admin.email === email)) {
      console.log(`Admin account with email "${email}" already exists. Seeding skipped.`);
      process.exit(0);
    }

    // 2. Check if any admin exists at all (only one admin is allowed)
    if (existingAdmins && existingAdmins.length > 0) {
      console.log(`An admin account already exists (${existingAdmins[0].email}). Only one admin is allowed. Seeding skipped.`);
      process.exit(0);
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Insert admin account
    const { data: newAdmin, error: insertError } = await supabase
      .from('admins')
      .insert([
        {
          email,
          password: hashedPassword
        }
      ])
      .select();

    if (insertError) {
      throw new Error(`Failed to insert admin: ${insertError.message}`);
    }

    console.log(`Successfully seeded Admin account in Supabase!`);
    console.log(`Email: ${email}`);
    console.log(`Password: [configured in .env or default]`);
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
