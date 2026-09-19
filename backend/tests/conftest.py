import os
import pytest

@pytest.fixture(autouse=True, scope="session")
def enable_test_mode():
    os.environ["KNOWLEDGE_DEBT_TEST_MODE"] = "true"
    yield
