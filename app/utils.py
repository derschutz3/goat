import re

def natural_sort_key(s):
    """
    Key function for natural sorting (e.g., '2' comes before '10').
    Usage: sorted(list, key=lambda x: natural_sort_key(x.name))
    """
    if not s:
        return []
    # Convert string to lowercase for case-insensitive sorting
    s = str(s).lower()
    # Split string into text and numeric parts
    return [int(text) if text.isdigit() else text for text in re.split('([0-9]+)', s)]
