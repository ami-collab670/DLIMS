"""Authentication tests for the laboratory API."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .base import BaseTestCase


class AuthenticationTests(BaseTestCase):
    """Every endpoint must reject unauthenticated requests with 401."""

    def test_test_catalog_list_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("testcatalog-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_job_order_list_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("joborder-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sample_list_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("sample-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_sample_test_list_unauthenticated(self):
        client = APIClient()
        response = client.get(reverse("sampletest-list"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_job_order_unauthenticated(self):
        client = APIClient()
        response = client.post(reverse("joborder-list"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_sample_unauthenticated(self):
        client = APIClient()
        response = client.post(reverse("sample-list"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_test_catalog_unauthenticated(self):
        client = APIClient()
        response = client.post(reverse("testcatalog-list"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
