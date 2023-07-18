from django.db import models
from modelcluster.models import ClusterableModel

from wagtail.models import Page
from wagtail.admin.panels import FieldPanel
from wagtail.contrib.settings.models import BaseSiteSetting, register_setting
from wagtail.fields import RichTextField


from wagtail.fields import StreamField


from content.core.blocks import FeaturedImageBlock, MenuBlock, StoryBlock


class WebSite(Page):
    template = 'patterns/pages/web_site.html'
    parent_page_types = ['wagtailcore.page']

    heading = models.CharField(max_length=255, blank=True)
    intro = models.TextField(blank=True)
    featured_image = StreamField(
        FeaturedImageBlock(), blank=True, use_json_field=True)
    story = StreamField(StoryBlock(), blank=True, use_json_field=True)

    content_panels = Page.content_panels + [
        FieldPanel("heading"),
        FieldPanel("intro"),
        FieldPanel("featured_image"),
        FieldPanel("story")
    ]


@register_setting(icon='list-ul')
class NavigationSettings(BaseSiteSetting, ClusterableModel):
    primary_navigation = StreamField(
        MenuBlock(),
        blank=True,
        help_text="Primary navigation",
        use_json_field=True
    )
    footer_navigation = StreamField(
        MenuBlock(),
        blank=True,
        help_text="Links at the bottom.",
        use_json_field=True
    )
    footer_text = RichTextField(
        features=['bold', 'italic', 'link'],
        blank=True,
        help_text="Small print text at the bottom of all pages. Not required."
    )

    panels = [
        FieldPanel('primary_navigation'),
        FieldPanel('footer_navigation'),
        FieldPanel('footer_text'),
    ]
