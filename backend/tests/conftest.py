import os
import pytest

# Member 3's backend test suite is written against the deterministic
# in-memory mock repository — force it explicitly so the suite stays green
# even when Member 2's durable database layer (database.compat) is installed.
os.environ.setdefault("KNOWLEDGE_DEBT_USE_MOCK", "true")
os.environ["KNOWLEDGE_DEBT_TEST_MODE"] = "true"

@pytest.fixture(autouse=True, scope="session")
def enable_test_mode():
    yield
