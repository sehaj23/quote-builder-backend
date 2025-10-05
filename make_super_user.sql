-- Make the first user a super user for testing
-- Replace 'your_email@example.com' with the actual email you're using to test

-- Show current users
SELECT email, is_super_user, is_approved FROM users;

-- Make the first user a super user (update with your actual email)
-- UPDATE users SET is_super_user = 1 WHERE email = 'your_email@example.com';

-- Show updated users
-- SELECT email, is_super_user, is_approved FROM users;