# Extending information models

## Create a new app

To create a new content model run `python manage.py startapp appname`

## Make migrations

Run `python manage.py makemigrations` to add migrations. If no changes are detected, try to specify the name of the app you want to migrate, e.g. `python manage.py migrate person`.

## Migrate the database

The command `python manage.py migrate` migrates the changes into your database.
