FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

# --forwarded-allow-ips is not optional here. Caddy runs in a sibling
# container, so without it uvicorn refuses to trust X-Forwarded-For and every
# visitor resolves to the Docker bridge gateway address -- which would make the
# contact-form rate limiter throttle the entire internet as a single client.
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
