<!DOCTYPE html>
<html lang="en">
<head>
        <title>Roastr</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <meta http-equiv="x-ua-compatible" content="ie=edge">
        <link href="/favicon.ico" rel="icon" type="images/x-icon" />
        <link rel="stylesheet" href="/css/app{% if env == "production" %}.min{% endif %}.css">
    </head>
    <body>
        {% block content %}{% endblock %}
        <script src="/scripts/app{% if env == "production" %}.min{% endif %}.js"></script>
    </body>
</html>