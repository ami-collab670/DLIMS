"""
Repo-root WSGI shim for Render when Start Command is still:
  gunicorn lsims_project.wsgi:application --bind 0.0.0.0:$PORT

Runs migrate/seed/bootstrap then delegates to LSIMS-Backend/LSIMS-main.
"""
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = REPO_ROOT / "LSIMS-Backend" / "LSIMS-main"

# Drop this shim package so the backend lsims_project package can load.
sys.modules.pop("lsims_project.wsgi", None)
sys.modules.pop("lsims_project", None)

repo_root_str = str(REPO_ROOT)
if repo_root_str in sys.path:
    sys.path.remove(repo_root_str)

sys.path.insert(0, str(BACKEND_ROOT))
os.chdir(BACKEND_ROOT)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "lsims_project.settings")

import django

django.setup()

from django.core.management import call_command

call_command("migrate", "--noinput")
call_command("seed_roles")
try:
    call_command(
        "create_user",
        email=os.environ.get("LSIMS_ADMIN_EMAIL", "admin@gie.com"),
        password=os.environ.get("LSIMS_ADMIN_PASSWORD", "seedpass!"),
        role="admin",
        update=True,
    )
except Exception:
    pass

from lsims_project.wsgi import application
