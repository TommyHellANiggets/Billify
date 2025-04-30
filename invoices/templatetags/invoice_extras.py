from django import template
from django.template.defaultfilters import stringfilter

register = template.Library()

@register.filter
@stringfilter
def replace(value, arg):
    """
    Replaces all instances of the first argument with the second argument.
    
    Usage:
    {{ value|replace:"old,new" }}
    """
    args = arg.split(':')
    if len(args) != 2:
        return value
    
    return value.replace(args[0], args[1]) 