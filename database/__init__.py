"""
Knowledge Debt Engine — persistence + testing layer (Member 2).

Public surface (everything else stays private to this package):

    database.connection    - engine / session factory / get_db()
    database.models        - ORM models + lifecycle enums
    database.state_machine - the ONLY legal transition map + rule exceptions
    database.repository    - the only DB access layer (returns plain dicts)
    database.seed          - demo data (concepts, students, evidence)

This package is self-contained: it never imports from backend/, frontend/ or
tests/, so it can be wired into the FastAPI app or exercised standalone.
"""
