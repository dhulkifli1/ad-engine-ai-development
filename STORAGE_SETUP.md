# Supabase Storage Setup Guide

## Current Issue
You're getting "new row violates row-level security policy" because Supabase storage requires RLS policies on the `storage.objects` table, even when buckets are set to "public".

## Solution
Run one of the SQL scripts in the `scripts` folder:

### Option 1: Public Uploads (Current Setup)
Run `scripts/001_setup_storage_policies.sql`

**Pros:**
- Works without authentication
- Users can upload files immediately

**Cons:**
- ⚠️ **Security Risk**: Anyone can upload files to your storage
- ⚠️ **Cost Risk**: Malicious users could fill your storage
- ⚠️ **Not recommended for production**

### Option 2: Authenticated Uploads (Recommended)
Run `scripts/002_setup_storage_policies_authenticated_only.sql`

**Pros:**
- ✅ Secure: Only authenticated users can upload
- ✅ Better control over who can upload
- ✅ Recommended for production

**Cons:**
- Requires users to be authenticated before uploading

## How to Run the Scripts

1. Click the "Run" button next to the script file in v0
2. Or copy the SQL and run it in your Supabase SQL Editor

## Buckets Required

Make sure you have created these buckets in Supabase Storage:
- `attachments` - for chat attachments and file uploads
- `avatars` - for user profile photos

### Creating Buckets in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Storage in the left sidebar
3. Click "New bucket"
4. Create a bucket named `attachments` and set it to **Public**
5. Create another bucket named `avatars` and set it to **Public**

## Next Steps

After running the appropriate SQL script:
1. Refresh your app
2. Try uploading a file again
3. The upload should now work!

## If You Want to Use Authentication

If you choose Option 2 (authenticated uploads), you'll need to implement authentication in your app. The codebase already has Supabase auth set up, but users need to sign in before they can upload files.
