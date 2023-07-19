from django.db import models

from wagtail.models import Page
from wagtail.fields import StreamField
from wagtail.admin.panels import FieldPanel

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

    content_panels = Page.content_panels + [
        FieldPanel("intro"),
        FieldPanel("featured_image"),
        FieldPanel("story"),
    ]
