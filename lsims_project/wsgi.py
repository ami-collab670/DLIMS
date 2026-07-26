"""
Repo-root WSGI shim for Render when Start Command is still:
  gunicorn lsims_project.wsgi:application --bind 0.0.0.0:$PORT

Runs migrate/seed/bootstrap then delegates to LSIMS-Backend/LSIMS-main.
"""
import importlib.util
import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent / "LSIMS-Backend" / "LSIMS-main"
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

_wsgi_path = BACKEND_ROOT / "lsims_project" / "wsgi.py"
_spec = importlib.util.spec_from_file_location("_lsims_backend_wsgi", _wsgi_path)
_mod = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_mod)
application = _mod.application
