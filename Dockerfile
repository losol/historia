################
# Stage: Build #
################

FROM python:3.10-slim AS build

# POETRY VERSION
ARG POETRY_VERSION=1.5.1

WORKDIR /app

# Export poetry dependencies to file
RUN pip install "poetry==$POETRY_VERSION"
COPY poetry.lock pyproject.toml ./
RUN python -m venv /app/venv
RUN poetry export --without-hashes --format requirements.txt --output /app/requirements.txt


################
# Stage: Run   #
################

FROM python:3.10-buster as prod

ENV PYTHONPATH=/app

WORKDIR /app

# Copy requirements from build stage, and install them
COPY --from=build /app/requirements.txt . 
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a non-root user to run the web server
RUN adduser -u 5678 --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

WORKDIR /app/
# Collect static files
RUN python manage.py collectstatic --noinput

# Run server
EXPOSE ${PORT:-8000}
CMD gunicorn --bind 0.0.0.0:${PORT:-8000} --timeout 600 settings.wsgi:application