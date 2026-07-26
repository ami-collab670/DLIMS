FROM python:3.12-slim-bookworm

ENV PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY docker-entrypoint.sh /docker-entrypoint.sh

COPY . .

EXPOSE 8000

ENTRYPOINT ["sh", "/docker-entrypoint.sh"]
CMD ["sh", "-c", "gunicorn lsims_project.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
