"""
Management command to create or update LSIMS users from the command line.

Docker (recommended — no local Python required):

    # From repo root (v1/), stack must be running: docker compose up -d
    .\\scripts\\create-user.ps1 \\
        --email admin@ministry.gov \\
        --password AdminPass123! \\
        --role admin

    docker compose exec backend python manage.py seed_roles
    docker compose exec backend python manage.py create_user \\
        --email admin@ministry.gov \\
        --password AdminPass123! \\
        --role admin

Local Python usage examples:

    # Internal admin (dev bootstrap)
    python manage.py create_user \\
        --email admin@ministry.gov \\
        --password AdminPass123! \\
        --type internal \\
        --role admin \\
        --first-name Admin \\
        --last-name User

    # Lab analyst
    python manage.py create_user \\
        --email analyst@ministry.gov \\
        --password AnalystPass123! \\
        --role analyst

    # External client
    python manage.py create_user \\
        --email client@company.com \\
        --password ClientPass123! \\
        --type external \\
        --organization-name "Acme Corp"

    # Reset password / role on existing dev user
    python manage.py create_user \\
        --email admin@ministry.gov \\
        --password NewPass123! \\
        --role admin \\
        --update

Prerequisite: roles must exist (run `python manage.py seed_roles` after migrate).
"""

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from accounts.models import Role, User

ROLE_CHOICES = [choice[0] for choice in Role.RoleName.choices]
USER_TYPE_CHOICES = [choice[0] for choice in User.UserType.choices]


class Command(BaseCommand):
    help = (
        "Create or update a user with internal/external type and optional role. "
        f"Roles: {', '.join(ROLE_CHOICES)}."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            required=True,
            help="Unique login email (normalized to lowercase).",
        )
        parser.add_argument(
            "--password",
            required=True,
            help="Plain password (min 8 chars, validated by Django password validators).",
        )
        parser.add_argument(
            "--type",
            dest="user_type",
            choices=USER_TYPE_CHOICES,
            default=User.UserType.INTERNAL,
            help="User type: internal (ministry staff) or external (client). Default: internal.",
        )
        parser.add_argument(
            "--role",
            choices=ROLE_CHOICES,
            help=f"Required for internal users. One of: {', '.join(ROLE_CHOICES)}.",
        )
        parser.add_argument(
            "--username",
            help="Username (defaults to email if omitted).",
        )
        parser.add_argument("--first-name", dest="first_name", default="", help="First name.")
        parser.add_argument("--last-name", dest="last_name", default="", help="Last name.")
        parser.add_argument("--phone", default="", help="Phone number.")
        parser.add_argument("--nationality", default="", help="Nationality (mainly for external clients).")
        parser.add_argument(
            "--organization-name",
            dest="organization_name",
            default="",
            help="Organization name (mainly for external clients).",
        )
        parser.add_argument(
            "--organization-type",
            dest="organization_type",
            default="",
            help="Organization type (mainly for external clients).",
        )
        parser.add_argument(
            "--update",
            action="store_true",
            help="Update an existing user matched by email instead of skipping.",
        )
        parser.add_argument(
            "--inactive",
            action="store_true",
            help="Create or update the user with is_active=False.",
        )
        parser.add_argument(
            "--superuser",
            action="store_true",
            help="Create or update as a Django superuser (bypasses RBAC checks).",
        )

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        password = options["password"]
        user_type = options["user_type"]
        role_name = options.get("role")
        username = (options.get("username") or email).strip()
        is_active = not options["inactive"]
        is_superuser = options["superuser"]
        update = options["update"]

        self._validate_password(password)
        role = self._resolve_role(user_type, role_name)

        profile_fields = {
            "first_name": options["first_name"],
            "last_name": options["last_name"],
            "phone": options["phone"],
            "nationality": options["nationality"],
            "organization_name": options["organization_name"],
            "organization_type": options["organization_type"],
        }

        existing = User.objects.filter(email=email).first()
        if existing:
            if not update:
                self.stdout.write(
                    self.style.WARNING(
                        f"User already exists: {email} — use --update to modify."
                    )
                )
                return
            user = self._update_user(
                existing,
                password=password,
                username=username,
                user_type=user_type,
                role=role,
                is_active=is_active,
                is_superuser=is_superuser,
                profile_fields=profile_fields,
            )
            action = "Updated"
        else:
            user = self._create_user(
                email=email,
                password=password,
                username=username,
                user_type=user_type,
                role=role,
                is_active=is_active,
                is_superuser=is_superuser,
                profile_fields=profile_fields,
            )
            action = "Created"

        self._print_success(action, user)

    def _validate_password(self, password):
        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters long.")
        try:
            validate_password(password)
        except ValidationError as exc:
            raise CommandError("; ".join(exc.messages)) from exc

    def _resolve_role(self, user_type, role_name):
        if user_type == User.UserType.INTERNAL:
            if not role_name:
                raise CommandError(
                    "Internal users must have --role. "
                    f"Choose one of: {', '.join(ROLE_CHOICES)}."
                )
            try:
                return Role.objects.get(role_name=role_name)
            except Role.DoesNotExist as exc:
                raise CommandError(
                    f"Role '{role_name}' not found. Run `python manage.py seed_roles` first."
                ) from exc

        if role_name:
            self.stdout.write(
                self.style.WARNING(
                    f"Ignoring --role '{role_name}' for external user (external users have no role)."
                )
            )
        return None

    def _create_user(
        self,
        *,
        email,
        password,
        username,
        user_type,
        role,
        is_active,
        is_superuser,
        profile_fields,
    ):
        create_kwargs = {
            "email": email,
            "username": username,
            "password": password,
            "user_type": user_type,
            "role": role,
            "is_active": is_active,
            **profile_fields,
        }
        if is_superuser:
            return User.objects.create_superuser(**create_kwargs)
        return User.objects.create_user(**create_kwargs)

    def _update_user(
        self,
        user,
        *,
        password,
        username,
        user_type,
        role,
        is_active,
        is_superuser,
        profile_fields,
    ):
        user.username = username
        user.set_password(password)
        user.user_type = user_type
        user.role = role
        user.is_active = is_active
        user.is_superuser = is_superuser
        for field, value in profile_fields.items():
            setattr(user, field, value)
        user.save()
        return user

    def _print_success(self, action, user):
        role_display = user.role.role_name if user.role else "(none)"
        self.stdout.write(
            self.style.SUCCESS(
                f"\n{action} user successfully:\n"
                f"  id:          {user.id}\n"
                f"  email:       {user.email}\n"
                f"  username:    {user.username}\n"
                f"  user_type:   {user.user_type}\n"
                f"  role:        {role_display}\n"
                f"  is_active:   {user.is_active}\n"
                f"  is_superuser: {user.is_superuser}"
            )
        )
