# Historia - knowledge management system

## Development

Run `poetry shell`, install deps wit `poetry install` and get ready with

- Database migration: `python manage.py migrate`
- Add super user: `python manage.py createsuperuser`
- Run dev server: `python manage.py runserver --settings settings.dev --nostatic`

Remember to prefix with `dotenv run` to use environment variables from `.env` file.

## Deployment

Set environment variables:

- SECRET_KEY
- ALLOWED_HOSTS
- AWS_STORAGE_BUCKET_NAME
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_REGION_NAME

Run `python manage.py collectstatic --noinput` to collect static files. After pushing static files to S3 you need to allow public access to them by editing the bucket policy.
