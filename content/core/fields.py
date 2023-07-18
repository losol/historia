"""
  @Credit: Linkfields and Colourfield based on the work of Torchbox
  @Links: https://github.com/torchbox/wagtail-torchbox/blob/master/tbx/core/fields.py
"""
import re

from wagtail.admin.panels import (
    FieldPanel
)
from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

color_re = re.compile(r"^[A-Fa-f0-9]{6}$")
color_validator = RegexValidator(color_re, _("Enter a valid color."), "invalid")


class LinkFields(models.Model):
    link_page = models.ForeignKey(
        "wagtailcore.Page",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    link_external = models.URLField("External link", blank=True)
    link_document = models.ForeignKey(
        "documents.StandardDocument",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )

    @property
    def link(self):
        if self.link_page:
            return self.link_page.url
        elif self.link_document:
            return self.link_document.url
        else:
            return self.link_external

    panels = [
        FieldPanel("link_page"),
        FieldPanel("link_external"),
        FieldPanel("link_document"),
    ]

    class Meta:
        abstract = True


class ColorField(models.CharField):
    default_validators = [color_validator]

    def __init__(self, *args, **kwargs):
        kwargs["max_length"] = 6
        super(ColorField, self).__init__(*args, **kwargs)
