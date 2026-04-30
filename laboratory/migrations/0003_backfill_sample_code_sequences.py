from django.db import migrations


def backfill_sample_code_sequences(apps, schema_editor):
    Sample = apps.get_model("laboratory", "Sample")
    SampleCodeSequence = apps.get_model("laboratory", "SampleCodeSequence")

    per_year_max = {}
    for sample_code in Sample.objects.values_list("sample_code", flat=True):
        if not sample_code:
            continue

        parts = sample_code.split("-")
        if len(parts) != 3 or parts[0] != "SMP":
            continue

        try:
            year = int(parts[1])
            number = int(parts[2])
        except ValueError:
            continue

        per_year_max[year] = max(number, per_year_max.get(year, 0))

    for year, last_number in per_year_max.items():
        sequence, created = SampleCodeSequence.objects.get_or_create(
            year=year,
            defaults={"last_number": last_number},
        )
        if not created and sequence.last_number < last_number:
            sequence.last_number = last_number
            sequence.save(update_fields=["last_number", "updated_at"])


class Migration(migrations.Migration):

    dependencies = [
        ("laboratory", "0002_samplecodesequence"),
    ]

    operations = [
        migrations.RunPython(backfill_sample_code_sequences, migrations.RunPython.noop),
    ]
