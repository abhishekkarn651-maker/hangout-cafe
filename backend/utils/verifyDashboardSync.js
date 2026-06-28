const dotenv = require('dotenv');
const path = require('path');
const fetch = globalThis.fetch;

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = require('../config/supabase');

const runSyncCheck = async () => {
  console.log('==================================================');
  console.log('   HANGOUT CAFE – REAL-TIME SYNC VERIFICATION   ');
  console.log('==================================================');

  const testCategory = 'coffee';
  const testItemName = 'Auto Verification Brew';
  const testPrice = 179;
  const testDesc = 'Freshly roasted robusta beans brewed automatically to verify Supabase real-time sync works.';
  const testImg = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800';

  try {
    // 1. Clean up any previous test items
    console.log('Cleaning up previous test verification entries...');
    await supabase.from('menu').delete().eq('item_name', testItemName);

    // 2. Simulate Admin inserting a menu item via the Dashboard (which calls the backend API)
    console.log('\nStep 1: Simulating Admin action...');
    console.log(`Adding new Menu Item: "${testItemName}" to Supabase database...`);

    const { data: insertedItem, error: insertError } = await supabase
      .from('menu')
      .insert([
        {
          category: testCategory,
          item_name: testItemName,
          description: testDesc,
          price: testPrice,
          image: testImg,
          is_available: true,
          is_featured: true
        }
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log(`✅ Success! Item inserted with ID: ${insertedItem.id}`);

    // 3. Simulate client website fetching updated details
    console.log('\nStep 2: Simulating Public Homepage load...');
    console.log('Querying the dynamic API endpoint GET /api/menu to verify client retrieval...');

    const PORT = process.env.PORT || 5000;
    const res = await fetch(`http://localhost:${PORT}/api/menu`);
    
    if (!res.ok) {
      throw new Error(`Public API returned status code ${res.status}`);
    }

    const payload = await res.json();
    
    if (!payload.success || !Array.isArray(payload.data)) {
      throw new Error(`Invalid payload format: ${JSON.stringify(payload)}`);
    }

    // 4. Verify match
    const syncedItem = payload.data.find(item => item.itemName === testItemName);

    if (!syncedItem) {
      throw new Error('Verification failed: The newly added menu item was not found in the public API menu list!');
    }

    console.log('✅ Success! Public site API returned the updated record:');
    console.log(`   - Name:  ${syncedItem.itemName}`);
    console.log(`   - Price:  ₹${syncedItem.price}`);
    console.log(`   - Active: ${syncedItem.isAvailable ? 'Yes' : 'No'}`);
    console.log(`   - URL:    ${syncedItem.image}`);

    console.log('\n==================================================');
    console.log(' STATUS: ALL SYSTEMS OPERATIONAL (SYNC VERIFIED) ');
    console.log('==================================================');

    // Clean up
    await supabase.from('menu').delete().eq('item_name', testItemName);
    process.exit(0);

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILURE:');
    console.error(error.message);
    console.log('Please ensure the Express server is running on port 5000 before executing this verifier.');
    process.exit(1);
  }
};

runSyncCheck();
