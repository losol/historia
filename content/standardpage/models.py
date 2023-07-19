from django.db import models

from wagtail.admin.panels import FieldPanel
from wagtail.fields import StreamField
from wagtail.models import Page

from content.core.blocks import FeaturedImageBlock, StoryBlock


class StandardPage(Page):
    class Meta:
        verbose_name = "Page"
        verbose_name_plural = "Pages"

    parent_page_types = ['StandardPage', 'core.WebSite']

    template = "patterns/pages/standard_page.html"

    intro = models.TextField(blank=True)

    featured_image = StreamField(
        FeaturedImageBlock(), blank=True, use_json_field=True)

    story = StreamField(StoryBlock(), blank=True, use_json_field=True)

    license = models.ForeignKey(
        'core.LicenseSnippet',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='+'
    )

    content_panels = Page.content_panels + [
        FieldPanel("intro"),
        FieldPanel("featured_image"),
        FieldPanel("story"),
        FieldPanel('license'),
    ]
