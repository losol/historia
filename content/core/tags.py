from django import template

register = template.Library()


# Primary nav snippets
@register.inclusion_tag('patterns/molecules/navigation/primarynav.html', takes_context=True)
def header_menu(context):
    request = context['request']
    return {
        'primarynav': NavigationSettings.for_site(request.site).primary_navigation,
        'request': request,
    }
