# Migration Instructions for Email Notification System

## Step 1: Backup Database

Before running migrations, backup your database:

```bash
# For PostgreSQL
pg_dump scholarship_portal > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Django's dumpdata
python manage.py dumpdata > backup_$(date +%Y%m%d_%H%M%S).json
```

## Step 2: Create Migrations

The `EmailLog` model requires a database migration:

```bash
cd backend
python manage.py makemigrations core
```

This will create a new migration file in `core/migrations/` directory.

## Step 3: Review Migration

Check the generated migration file (should be something like `core/migrations/00XX_initial.py`):

```bash
# View the migration
cat core/migrations/00XX_initial.py

# Or use showmigrations to see all pending migrations
python manage.py showmigrations
```

Expected output should show the new EmailLog model being created.

## Step 4: Apply Migration

Run the migration to create the table:

```bash
python manage.py migrate core
```

Verify the migration was successful:

```bash
python manage.py showmigrations core
# Should show [X] core.00XX_initial
```

## Step 5: Verify Installation

Check that the EmailLog table was created:

```bash
python manage.py shell
```

Then in the shell:

```python
from core.models import EmailLog
from django.db import connection

# Check if table exists
tables = connection.introspection.table_names()
print('emaillog' in [t.lower() for t in tables])  # Should be True

# Check model fields
print(EmailLog._meta.get_fields())
```

## Step 6: Configure Email Settings

Update your `.env` file:

```env
# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=no-reply@regional-scholarship.local
FRONTEND_URL=http://localhost:5173
```

## Step 7: Restart Django

Restart your Django development server:

```bash
python manage.py runserver
```

Or if using Docker:

```bash
docker-compose restart web
```

## Step 8: Test Installation

Test the email system:

```bash
python manage.py test_emails --user-email=test@example.com --email-type=registration
```

Check the output for success/failure messages.

## Production Migration

### Render Deployment

1. Update `.env` in Render dashboard with email configuration
2. No manual migration needed - Render handles it automatically
3. Deploy: `git push`

### Manual Server

```bash
# SSH into server
ssh user@server

# Navigate to project
cd /path/to/regional-scholarship-portal

# Pull latest code
git pull origin main

# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Restart service
sudo systemctl restart scholarship-portal
```

## Rollback (If Needed)

If you need to rollback the migration:

```bash
# See migration history
python manage.py showmigrations core

# Rollback to previous migration
python manage.py migrate core 0001_initial
# Or to a specific migration number

# Or reverse all migrations for core app
python manage.py migrate core zero
```

## Troubleshooting

### Migration Conflicts

If you encounter migration conflicts:

```bash
# Check migration status
python manage.py showmigrations

# If there are unapplied migrations
python manage.py migrate --plan

# Apply all pending migrations
python manage.py migrate
```

### Database Errors

If you get database errors:

```bash
# Check database connection
python manage.py dbshell

# Verify tables
.tables  # PostgreSQL
SHOW TABLES;  # MySQL

# Exit
\q  # PostgreSQL
exit  # MySQL
```

### Permission Errors

If you get permission errors on Linux/Mac:

```bash
# Make manage.py executable
chmod +x manage.py

# Try running with python explicitly
python manage.py migrate
```

## Verifying in Django Admin

After successful migration:

1. Log in to Django admin: `/admin/`
2. Navigate to "Core" section
3. Click "Email logs"
4. You should see email records appear as emails are sent

## Next Steps

1. Set up email credentials in `.env`
2. Test email sending with management command
3. Monitor email logs in admin
4. Configure frontend integration
5. Set up production monitoring
