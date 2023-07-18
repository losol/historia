# -*- coding: utf-8 -*-
from django.db import migrations


def create_website(apps, schema_editor):
    # Get models
    ContentType = apps.get_model("contenttypes.ContentType")
    Page = apps.get_model("wagtailcore.Page")
    Site = apps.get_model("wagtailcore.Site")
    WebSite = apps.get_model("core.WebSite")

    # Delete the default website
    # If migration is run multiple times, it may have already been deleted
    Page.objects.filter(id=2).delete()

    # Create content type for website model
    website_content_type, __ = ContentType.objects.get_or_create(
        model="website", app_label="core"
    )

    # Create a new website
    website = WebSite.objects.create(
        title="Home",
        draft_title="Home",
        slug="home",
        content_type=website_content_type,
        path="00010001",
        depth=2,
        numchild=0,
        url_path="/home/",
    )

    # Create a site with the new website set as the root
    Site.objects.create(hostname="localhost",
                        root_page=website, is_default_site=True)


def remove_website(apps, schema_editor):
    # Get models
    ContentType = apps.get_model("contenttypes.ContentType")
    WebSite = apps.get_model("core.WebSite")

    # Delete the default website
    # Page and Site objects CASCADE
    WebSite.objects.filter(slug="home", depth=2).delete()

    # Delete content type for website model
    ContentType.objects.filter(model="website", app_label="home").delete()


class Migration(migrations.Migration):

    run_before = [
        ("wagtailcore", "0053_locale_model"),
    ]

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_website, remove_website),
    ]
