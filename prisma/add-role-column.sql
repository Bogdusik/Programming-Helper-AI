-- SQL script to safely add role column to users table
-- This can be run manually on production database if db:push fails

-- Check if role column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(255) DEFAULT 'user';
        UPDATE users SET role = 'user' WHERE role IS NULL;
        ALTER TABLE users ALTER COLUMN role SET NOT NULL;
        RAISE NOTICE 'Column role added successfully';
    ELSE
        RAISE NOTICE 'Column role already exists';
    END IF;
END $$;

