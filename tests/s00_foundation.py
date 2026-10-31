"""Static packaging checks; behavior and SQL execution are tested by npm test."""
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class PackagingTests(unittest.TestCase):
    def test_auth_scaffold_is_not_a_deployable_migration(self):
        for path in (ROOT / 'supabase/migrations').glob('*.sql'):
            self.assertNotIn('CREATE TABLE IF NOT EXISTS auth.users', path.read_text())
    def test_no_dummy_passwords_in_seed(self):
        seed = (ROOT / 'supabase/seed.sql').read_text()
        self.assertNotIn('syntheticpasswordhash', seed)
        self.assertNotIn('INSERT INTO auth.users', seed)
    def test_container_assets_and_workflow_exist(self):
        for name in ['package-lock.json', 'public/robots.txt', 'Dockerfile', '.github/workflows/ci.yml']:
            self.assertTrue((ROOT / name).is_file(), name)
if __name__ == '__main__': unittest.main()
