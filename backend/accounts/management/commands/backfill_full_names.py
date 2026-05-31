import csv
import os

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Backfill ApplicantProfile.full_name for users from a CSV or derive from email'

    def add_arguments(self, parser):
        parser.add_argument('--csv', type=str, help='Path to CSV file with columns: email,full_name')
        parser.add_argument('--derive-from-email', action='store_true', help='Derive full_name from email local-part')
        parser.add_argument('--commit', action='store_true', help='Apply changes (default is dry-run)')

    def handle(self, *args, **options):
        csv_path = options.get('csv')
        derive = options.get('derive_from_email')
        commit = options.get('commit')

        from django.contrib.auth import get_user_model
        from accounts.models import ApplicantProfile

        User = get_user_model()

        updates = []

        if csv_path:
            if not os.path.exists(csv_path):
                self.stderr.write(self.style.ERROR(f'CSV file not found: {csv_path}'))
                return

            with open(csv_path, newline='', encoding='utf-8') as fh:
                reader = csv.DictReader(fh)
                if 'email' not in reader.fieldnames or 'full_name' not in reader.fieldnames:
                    self.stderr.write(self.style.ERROR('CSV must have columns: email,full_name'))
                    return
                for row in reader:
                    email = row.get('email')
                    full_name = row.get('full_name')
                    if not email or full_name is None:
                        continue
                    u = User.objects.filter(email__iexact=email.strip()).first()
                    if not u:
                        self.stdout.write(self.style.WARNING(f'User not found: {email}'))
                        continue
                    updates.append((u, full_name.strip()))

        elif derive:
            for u in User.objects.all():
                if not getattr(getattr(u, 'profile', None), 'full_name', None):
                    local = u.email.split('@', 1)[0]
                    # replace dots/underscores with spaces and title-case
                    full_name = ' '.join(part.capitalize() for part in local.replace('_', ' ').replace('.', ' ').split())
                    if full_name:
                        updates.append((u, full_name))

        else:
            self.stdout.write(self.style.ERROR('Specify --csv or --derive-from-email'))
            return

        if not updates:
            self.stdout.write('No updates to perform')
            return

        self.stdout.write(self.style.NOTICE(f'Prepared {len(updates)} updates (commit={commit})'))

        for u, full_name in updates:
            p = getattr(u, 'profile', None)
            if not p:
                p = ApplicantProfile.objects.create(user=u)
            old = p.full_name or ''
            if old.strip() == full_name.strip():
                self.stdout.write(self.style.WARNING(f'No change for {u.email} (already "{old}")'))
                continue
            self.stdout.write(f'{u.email}: "{old}" => "{full_name}"')
            if commit:
                p.full_name = full_name
                p.save()

        if commit:
            self.stdout.write(self.style.SUCCESS('Backfill committed'))
        else:
            self.stdout.write(self.style.NOTICE('Dry-run complete. Rerun with --commit to apply changes.'))
