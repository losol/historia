"""
  @Credit: Many of the blocks based on the work of Torchbox
  @Links: https://github.com/torchbox/wagtail-torchbox/blob/master/tbx/core/blocks.py
"""

from django import forms
from django.db import models

from wagtail.blocks import (CharBlock, FieldBlock, ListBlock, PageChooserBlock,
                            RawHTMLBlock, RichTextBlock, StreamBlock,
                            StructBlock, URLBlock,)
from wagtail.embeds.blocks import EmbedBlock
from wagtail.images.blocks import ImageChooserBlock
from wagtailmarkdown.blocks import MarkdownBlock

# Menu

class MenuLink(StructBlock):
    title = CharBlock(max_length=100)
    link_page = PageChooserBlock(required=False)
    link_url = URLBlock(required=False)

    def get_url(self):
        if self.link_page:
            return self.link_page.get_url

        return self.link_url


class MenuBlock(StreamBlock):
    link = MenuLink()

    class Meta:
        icon = "menu"

# Featured Image


class FeaturedImage(StructBlock):
    image = ImageChooserBlock()
    alt = CharBlock(required=False)
    caption = CharBlock(required=False)


class FeaturedImageBlock(StreamBlock):
    image = FeaturedImage(
        label="Image",
        template="patterns/blocks/image_block.html",
    )

    class Meta:
        min_num = 0
        max_num = 1

# Story Blocks


class ImageFormatChoiceBlock(FieldBlock):
    field = forms.ChoiceField(
        choices=(
            ("left", "Wrap left"),
            ("right", "Wrap right"),
            ("full", "Full width"),
            ("wide", "Wide image"),
        )
    )


class ImageBlock(StructBlock):
    image = ImageChooserBlock()
    alt = CharBlock(required=False)
    caption = CharBlock(required=False)
    alignment = ImageFormatChoiceBlock(default="full")

    class Meta:
        icon = "image"


class ImageGridBlock(StructBlock):
    images = ListBlock(ImageBlock())

    class Meta:
        icon = "grip"


class PullQuoteBlock(StructBlock):
    quote = CharBlock(form_classname="quote title")
    attribution = CharBlock(required=False)
    attribution_url = URLBlock(required=False)

    class Meta:
        icon = "openquote"


class BlockQuoteBlock(StructBlock):
    quote = RichTextBlock(form_classname="quote text")
    attribution = CharBlock(required=False)
    attribution_url = URLBlock(required=False)

    class Meta:
        icon = "openquote"


class StoryBlock(StreamBlock):
    text = RichTextBlock(
        icon="pilcrow",
        template="patterns/blocks/text_block.html",
    )
    image = ImageBlock(
        label="Image",
        template="patterns/blocks/image_block.html",
    )
    image_grid = ImageGridBlock(
        label="Image grid",
        template="patterns/blocks/image_grid_block.html",
    )
    blockquote = BlockQuoteBlock(
        template="patterns/blocks/blockquote_block.html"
    )
    pullquote = PullQuoteBlock(
        template="patterns/blocks/pullquote_block.html"
    )
    raw_html = RawHTMLBlock(
        label="Raw HTML",
        icon="code",
        template="patterns/blocks/raw_html_block.html",
    )
    embed = EmbedBlock(
        icon="code",
        template="patterns/blocks/embed_block.html",
    )
    markdown = MarkdownBlock(
        icon="code",
        template="patterns/blocks/markdown_block.html",
    )

    class Meta:
        template = "patterns/blocks/default_block.html"
