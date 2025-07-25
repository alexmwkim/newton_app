// Database Migration Script for Subpage Functionality
// Run this in your React Native app to add missing columns

import { supabase } from './src/services/supabase'; // Adjust path as needed

export const migrateDatabase = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Step 1: Add is_subpage column
    const { error: isSubpageError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_subpage boolean DEFAULT false;`
    });
    
    if (isSubpageError) {
      console.error('❌ Error adding is_subpage column:', isSubpageError);
    } else {
      console.log('✅ Added is_subpage column');
    }
    
    // Step 2: Add parent_note_id column
    const { error: parentError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE notes ADD COLUMN IF NOT EXISTS parent_note_id uuid REFERENCES notes(id) ON DELETE CASCADE;`
    });
    
    if (parentError) {
      console.error('❌ Error adding parent_note_id column:', parentError);
    } else {
      console.log('✅ Added parent_note_id column');
    }
    
    // Step 3: Update existing notes
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `UPDATE notes SET is_subpage = false WHERE is_subpage IS NULL;`
    });
    
    if (updateError) {
      console.error('❌ Error updating existing notes:', updateError);
    } else {
      console.log('✅ Updated existing notes');
    }
    
    // Step 4: Verify schema
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'notes' 
            AND column_name IN ('is_subpage', 'parent_note_id')
            ORDER BY column_name;`
    });
    
    if (schemaError) {
      console.error('❌ Error verifying schema:', schemaError);
    } else {
      console.log('✅ Schema verification:', schemaData);
    }
    
    console.log('🎉 Database migration completed!');
    return { success: true };
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { success: false, error };
  }
};

// Usage: Import and call migrateDatabase() in your app