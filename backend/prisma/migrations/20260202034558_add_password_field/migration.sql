-- Fix existing NULL emails with placeholder values based on user id
UPDATE "User" SET email = CONCAT('user_', id, '@placeholder.com') WHERE email IS NULL;

-- Make email required
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;

-- Add password column as nullable first
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- Set a placeholder password hash for existing users (they'll need to reset)
UPDATE "User" SET password = '$2b$10$placeholderHashForExistingUsers' WHERE password IS NULL;

-- Now make password required
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
