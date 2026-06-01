"""
Centralized visibility policies for laboratory data.

These helpers keep role, client, and department filtering in one place so new
workflow endpoints can reuse the same access rules instead of duplicating them.
"""

from .models import FinancialRecord, JobOrder, Sample, SampleTest, TestCatalog


DEPARTMENT_SCOPED_ROLES = {"analyst", "qc_manager"}


def get_role_name(user):
    """Return the LSIMS role name for a user, if one is assigned."""
    return getattr(user, "role_name", None)


def get_department_id(user):
    """Return the user's department id, if one is assigned."""
    return getattr(user, "department_id", None)


def is_external_client(user):
    """Return whether the user is an external client."""
    return getattr(user, "user_type", None) == "external"


def tests_visible_to(user, queryset=None):
    """Return test catalog entries visible to the given user."""
    queryset = queryset if queryset is not None else TestCatalog.objects.all()

    if user.is_superuser:
        return queryset

    if get_role_name(user) in DEPARTMENT_SCOPED_ROLES:
        department_id = get_department_id(user)
        if department_id is None:
            return queryset.none()
        return queryset.filter(department_id=department_id)

    return queryset


def financial_records_visible_to(user, queryset=None):
    """Return financial records visible to the given user."""
    queryset = queryset if queryset is not None else FinancialRecord.objects.all()

    if user.is_superuser:
        return queryset

    if is_external_client(user):
        return queryset.filter(job__client=user)

    if get_role_name(user) in {"admin", "finance", "receptionist"}:
        return queryset

    return queryset.none()


def jobs_visible_to(user, queryset=None):
    """Return job orders visible to the given user."""
    queryset = queryset if queryset is not None else JobOrder.objects.all()

    if user.is_superuser:
        return queryset

    if is_external_client(user):
        return queryset.filter(client=user)

    role_name = get_role_name(user)
    department_id = get_department_id(user)

    if role_name == "analyst":
        if department_id is None:
            return queryset.none()
        return queryset.filter(
            samples__assigned_analyst=user,
            samples__sample_tests__test__department_id=department_id,
        ).distinct()

    if role_name == "qc_manager":
        if department_id is None:
            return queryset.none()
        return queryset.filter(
            samples__sample_tests__test__department_id=department_id,
        ).distinct()

    return queryset


def samples_visible_to(user, queryset=None):
    """Return samples visible to the given user."""
    queryset = queryset if queryset is not None else Sample.objects.all()

    if user.is_superuser:
        return queryset

    role_name = get_role_name(user)
    department_id = get_department_id(user)

    if role_name == "analyst":
        if department_id is None:
            return queryset.none()
        return queryset.filter(
            assigned_analyst=user,
            sample_tests__test__department_id=department_id,
        ).distinct()

    if role_name == "qc_manager":
        if department_id is None:
            return queryset.none()
        return queryset.filter(
            sample_tests__test__department_id=department_id,
        ).distinct()

    if is_external_client(user):
        return queryset.filter(job__client=user)

    return queryset


def sample_tests_visible_to(user, queryset=None):
    """Return sample-test assignments visible to the given user."""
    queryset = queryset if queryset is not None else SampleTest.objects.all()

    if user.is_superuser:
        return queryset

    if is_external_client(user):
        return queryset.filter(sample__job__client=user)

    role_name = get_role_name(user)
    department_id = get_department_id(user)

    if role_name == "analyst":
        if department_id is None:
            return queryset.none()
        return queryset.filter(
            sample__assigned_analyst=user,
            test__department_id=department_id,
        )

    if role_name == "qc_manager":
        if department_id is None:
            return queryset.none()
        return queryset.filter(test__department_id=department_id)

    return queryset


def sample_tests_for_sample_visible_to(sample, user):
    """Return a sample's test assignments filtered for a specific user."""
    queryset = sample.sample_tests.select_related("test", "test__department")
    if not user or not user.is_authenticated:
        return queryset.all()
    return sample_tests_visible_to(user, queryset)

