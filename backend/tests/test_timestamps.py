import unittest
from datetime import datetime, timedelta, timezone
from app.db.serializers import iso_utc


class TimestampTest(unittest.TestCase):
    def test_naive_storage_and_aware_values_describe_the_same_instant(self):
        naive = datetime(2026, 10, 28, 23, 8)
        peru = datetime(2026, 10, 28, 18, 8, tzinfo=timezone(timedelta(hours=-5)))
        self.assertEqual(iso_utc(naive), "2026-10-28T23:08:00+00:00")
        self.assertEqual(iso_utc(peru), iso_utc(naive))
        self.assertIsNone(iso_utc(None))
