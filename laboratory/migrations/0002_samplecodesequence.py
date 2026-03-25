from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("laboratory", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="SampleCodeSequence",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("year", models.PositiveIntegerField(unique=True)),
                ("last_number", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "sample_code_sequences",
                "ordering": ["-year"],
            },
        ),
    ]
