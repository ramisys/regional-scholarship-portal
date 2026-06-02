# Cloudinary Setup Guide

## Overview

Cloudinary is a cloud-based media management and delivery platform used by the Regional Scholarship Portal for storing and serving uploaded documents (PDFs, images, etc.). Instead of storing files locally on the server, all media uploads are stored in Cloudinary's cloud infrastructure, which provides:

- **Scalability**: Unlimited storage capacity
- **CDN Delivery**: Fast content delivery worldwide
- **Security**: Secure file storage and URL signing
- **Backup**: Automatic backups and redundancy
- **Management**: Web dashboard for file management and organization

## Why Cloudinary?

- Files persist across server restarts and deployments
- No need to manage local file storage on the server
- Automatic image optimization and transformations
- Secure, signed URLs for restricted access
- Easy integration with Django via `cloudinary-storage`

## Prerequisites

- Free or paid Cloudinary account (free tier includes 25GB storage)
- Access to Cloudinary dashboard

## Step 1: Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com/)
2. Click **Sign Up** (top right)
3. Choose a sign-up method:
   - Email address
   - Google account
   - GitHub account
4. Fill in the registration form:
   - Email
   - Password (if using email signup)
   - Verify your email
5. Complete account setup and accept terms

## Step 2: Get Your API Credentials

1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. You'll see your **Account Details** at the top of the dashboard
3. Look for these three values:

   - **Cloud Name** (e.g., `dtdeiw5xq`)
     - This is your unique cloud identifier
     - Usually auto-generated, can be customized (Settings → Account)
   
   - **API Key** (e.g., `925423174496322`)
     - Long numeric string
     - Used for authentication
   
   - **API Secret** (e.g., `6NyByVqgiYx_eRAABqfYbnFLruo`)
     - **Keep this secret!** Never commit to git or share publicly
     - Used for secure API requests

4. ⚠️ **Security**: Store these credentials in environment variables only, never hardcode them.

## Step 3: Configure Local Development Environment

### Option A: Using Individual POSTGRES Variables (Default)

1. Open `backend/.env`:

```bash
cd backend
```

2. Add or update Cloudinary variables:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

3. Example with actual values (replace with your own):

```env
CLOUDINARY_CLOUD_NAME=dtdeiw5xq
CLOUDINARY_API_KEY=925423174496322
CLOUDINARY_API_SECRET=6NyByVqgiYx_eRAABqfYbnFLruo
```

### Option B: Using Root .env (if needed)

If you have a root `.env` file at the repository root, also add:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Step 4: Verify Configuration

### Test in Django Shell

```bash
cd backend
python manage.py shell
```

In the shell, run:

```python
from django.conf import settings

# Check if Cloudinary is configured
print("Cloud Name:", settings.CLOUDINARY_STORAGE['CLOUD_NAME'])
print("API Key:", settings.CLOUDINARY_STORAGE['API_KEY'])
print("API Secret:", settings.CLOUDINARY_STORAGE['API_SECRET'])
```

Expected output:

```
Cloud Name: dtdeiw5xq
API Key: 925423174496322
API Secret: 6NyByVqgiYx_eRAABqfYbnFLruo
```

### Test File Upload (via Django Admin)

1. Start the Django development server:

```bash
python manage.py runserver
```

2. Go to `http://localhost:8000/admin`
3. Log in with admin credentials
4. Navigate to **Core → Email Logs** (or any model with file uploads)
5. Try uploading a file - it should upload to Cloudinary

## Step 5: Create an Upload Preset (Optional but Recommended)

For unsigned uploads (client-side uploads without server authentication):

1. Go to [Cloudinary Settings → Upload](https://cloudinary.com/console/settings/upload)
2. Scroll to **Upload Presets**
3. Click **Add Upload Preset**
4. Configure:
   - **Preset Name**: `scholarship_portal_uploads`
   - **Signing Mode**: Unsigned (for client-side uploads)
   - **Allowed Formats**: `pdf, png, jpg, jpeg, doc, docx`
   - **Max File Size**: `5242880` bytes (5MB)
5. Save the preset
6. Use the preset name in API calls

## Step 6: Configure Security Settings (Important for Production)

### In Cloudinary Dashboard:

1. Go to **Settings → Security**
2. Enable **Restrict allowed upload types**:
   - Check: `pdf`, `image`, `document`
3. Enable **Restrict file sizes**:
   - Max size: 5 MB
4. Enable **Require signed URLs** (if using private uploads)

### In Django Settings (`backend/config/settings.py`):

The app already validates uploads, but ensure:

```python
# File upload limits
MAX_UPLOAD_SIZE_BYTES = 5242880  # 5 MB
MAX_DOCUMENTS_PER_APPLICATION = 10
```

## Step 7: Test with Real File Upload

### Using the API:

```bash
curl -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/document.pdf"
```

### Using the Web Interface:

1. Log in to the portal as a student
2. Go to **Documents Upload**
3. Upload a file (PDF, image, etc.)
4. Verify the upload succeeds
5. Check Cloudinary Dashboard to see the file in your cloud

## Step 8: Environment Variables Summary

### Backend Variables (.env or backend/.env):

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### What Each Variable Does:

| Variable | Purpose | Example |
|----------|---------|---------|
| `CLOUDINARY_CLOUD_NAME` | Your unique Cloudinary account identifier | `dtdeiw5xq` |
| `CLOUDINARY_API_KEY` | Public API key for authentication | `925423174496322` |
| `CLOUDINARY_API_SECRET` | Secret key for signing requests (KEEP PRIVATE!) | `6NyByVqgiYx_eRAABqfYbnFLruo` |

## Production Deployment

### On Render:

1. Go to your Render Service settings
2. Add environment variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

3. Redeploy the service

### On Docker:

Add to `docker-compose.prod.yml`:

```yaml
environment:
  - CLOUDINARY_CLOUD_NAME=your-cloud-name
  - CLOUDINARY_API_KEY=your-api-key
  - CLOUDINARY_API_SECRET=your-api-secret
```

Or pass via `.env` file mounted to the container.

### Security in Production:

1. ✅ Never commit credentials to git
2. ✅ Use platform secrets (Render Secrets, GitHub Secrets, etc.)
3. ✅ Rotate API keys periodically
4. ✅ Use separate Cloudinary accounts for dev/prod (optional)
5. ✅ Enable rate limiting in Cloudinary dashboard

## API Usage in Backend

The Django backend automatically uses Cloudinary for all file uploads. When a user uploads a document:

1. File is sent to Django backend
2. Django validates the file (type, size)
3. File is stored in Cloudinary
4. Cloudinary returns a secure URL
5. URL is saved in the database

### Manual Upload (if needed):

```python
from cloudinary.uploader import upload

# Upload a file
result = upload('path/to/file.pdf', folder='documents')
print(result['secure_url'])  # Get the URL
```

## Frontend Integration

The frontend **does not directly upload to Cloudinary**. Instead:

1. Frontend sends file to `POST /api/documents/upload`
2. Backend validates and uploads to Cloudinary
3. Backend returns the file URL to frontend
4. Frontend displays the document link

This is more secure than client-side uploads.

## Troubleshooting

### Issue: "Cloudinary credentials missing in production"

**Solution**: Add environment variables to your hosting platform.

### Issue: "File upload fails with 401 error"

**Solution**: Check that `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are correct.

### Issue: "Upload timeout or 413 error"

**Solution**: File is too large. Max size is 5 MB.

### Issue: "Cannot see files in Cloudinary dashboard"

**Solution**: Wait a few seconds for upload to complete. Check your Cloudinary account was charged correctly for uploads (free tier has 25 GB limit).

### Issue: "Getting 'Cloudinary not configured' error"

**Solution**: Ensure `backend/.env` has all three Cloudinary variables set, then restart Django:

```bash
python manage.py runserver
```

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.env` and `.gitignore`
   - Never paste credentials in code

2. **Use separate accounts for dev/prod**
   - Free account for development
   - Paid account for production

3. **Rotate API keys regularly**
   - Go to Settings → API Keys
   - Regenerate keys every 6 months

4. **Enable signed URLs in production**
   - Prevents unauthorized file access
   - Requires signing requests with API secret

5. **Monitor upload usage**
   - Cloudinary dashboard shows bandwidth and storage
   - Free tier has 25 GB storage limit

6. **Use environment variables, not hardcoding**
   - ✅ Good: `os.getenv('CLOUDINARY_API_KEY')`
   - ❌ Bad: `CLOUDINARY_API_KEY = "925423174496322"`

## Limits & Pricing

### Free Tier:

- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: Unlimited
- **Uploads**: Unlimited
- **Files**: Unlimited

### When to Upgrade:

- If storage usage exceeds 25 GB
- If monthly bandwidth exceeds 25 GB
- Need advanced features (facial recognition, etc.)

Check [Cloudinary Pricing](https://cloudinary.com/pricing) for details.

## Common Use Cases

### 1. User Uploads a Document

```
Frontend → POST /api/documents/upload → Backend → Cloudinary
                                                      ↓
                                            Secure URL stored in DB
                                                      ↓
                                            Frontend can retrieve via API
```

### 2. Admin Serves a File

```
Admin → Click download link → Backend gets Cloudinary URL → Redirect to Cloudinary
                                                                     ↓
                                                            Cloudinary serves file
```

### 3. Bulk Delete Old Files

```
Cloudinary Dashboard → Media Library → Select files → Delete
```

## Advanced: Direct File Access

### Public URL Format:

```
https://res.cloudinary.com/{cloud-name}/image/upload/{public_id}.{format}
```

Example:

```
https://res.cloudinary.com/dtdeiw5xq/raw/upload/v1234567890/documents/xyz.pdf
```

### Signed/Private URL (requires secret):

```python
from cloudinary.utils import cloudinary_url

# Generate signed URL valid for 1 hour
url, options = cloudinary_url('documents/xyz.pdf', 
                               sign_url=True, 
                               type='authenticated',
                               resource_type='raw')
```

## Support & Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Django Cloudinary Storage](https://github.com/cloudinary/pycloudinary)
- [Cloudinary API Reference](https://cloudinary.com/documentation/cloudinary_api)
- [Cloudinary Dashboard](https://cloudinary.com/console)

## Quick Reference

```bash
# Test Cloudinary connection
python manage.py shell
from django.conf import settings
print(settings.CLOUDINARY_STORAGE)

# View uploaded files
# Open Cloudinary Dashboard → Media Library

# Redeploy after changing credentials
docker compose -f docker-compose.prod.yml up -d --build
```
