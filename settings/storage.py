from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage, S3ManifestStaticStorage


class S3StaticStorage(S3ManifestStaticStorage):
    location = settings.STATICFILES_LOCATION


class S3PublicMediaStorage(S3Boto3Storage):
    location = settings.MEDIAFILES_LOCATION
