import os
import subprocess
import sys
import unittest


class MetadataIsolationTest(unittest.TestCase):
    def test_importing_models_does_not_initialize_a_database(self):
        environment = dict(os.environ, DATABASE_URL="sqlite:///:memory:")
        check = subprocess.run(
            [sys.executable, "-c", "import sys; import app.db.models; assert 'app.db.database' not in sys.modules"],
            env=environment, capture_output=True, text=True,
        )
        self.assertEqual(check.returncode, 0, check.stderr)
