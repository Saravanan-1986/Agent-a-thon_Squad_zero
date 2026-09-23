"""
LangSmith Observability Module

Central tracing instrumentation for the Knowledge Debt Engine.

LangSmith observes agent/LLM execution without changing application logic.
If LangSmith is unavailable, disabled, or unreachable, the application
continues normally.
"""

import os
import logging
from typing import Any, Dict, List, Optional, Callable
from functools import wraps

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("backend.observability")

LANGSMITH_TRACING_ENABLED = (
    os.getenv("LANGSMITH_TRACING", "false").lower()
    in ("true", "1", "yes")
)

LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY", "").strip()
LANGSMITH_PROJECT = os.getenv(
    "LANGSMITH_PROJECT",
    "Knowledge-Debt-Engine"
).strip()

LANGSMITH_ENDPOINT = os.getenv(
    "LANGSMITH_ENDPOINT",
    "https://api.smith.langchain.com"
).strip()

LANGSMITH_INSTALLED = False
ls_traceable = None
LANGSMITH_CLIENT = None

try:
    from langsmith import Client
    from langsmith import traceable as ls_traceable

    LANGSMITH_INSTALLED = True

    if LANGSMITH_API_KEY:
        LANGSMITH_CLIENT = Client(
            api_url=LANGSMITH_ENDPOINT,
            api_key=LANGSMITH_API_KEY,
        )

        logger.info(
            "LangSmith tracing enabled: project=%s",
            LANGSMITH_PROJECT,
        )
    else:
        logger.info(
            "LangSmith SDK installed but LANGSMITH_API_KEY is not configured."
        )

except Exception as e:
    LANGSMITH_INSTALLED = False
    ls_traceable = None
    LANGSMITH_CLIENT = None

    logger.warning(
        "LangSmith initialization failed: %s",
        e,
    )


def safe_traceable(
    name: Optional[str] = None,
    run_type: str = "chain",
    tags: Optional[List[str]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    **ls_kwargs,
):
    """
    Safe LangSmith tracing decorator.

    If LangSmith is configured, traces are sent to the configured project.
    Otherwise, the original function executes normally.
    """

    if callable(name):
        func = name
        return safe_traceable(
            name=func.__name__,
            run_type=run_type,
            tags=tags,
            metadata=metadata,
            **ls_kwargs,
        )(func)

    def decorator(func: Callable):
        if (
            LANGSMITH_TRACING_ENABLED
            and LANGSMITH_INSTALLED
            and ls_traceable is not None
            and LANGSMITH_CLIENT is not None
        ):
            func_name = name or func.__name__

            default_tags = list(tags) if tags else []

            if "knowledge-debt-engine" not in default_tags:
                default_tags.append("knowledge-debt-engine")

            default_metadata = {
                "project": LANGSMITH_PROJECT,
                "provider": "openrouter",
                **(metadata or {}),
            }

            cleaned_kwargs = {
                k: v for k, v in ls_kwargs.items()
                if k not in {"name", "client"}
            }

            try:
                return ls_traceable(
                    name=func_name,
                    run_type=run_type,
                    tags=default_tags,
                    metadata=default_metadata,
                    client=LANGSMITH_CLIENT,
                    **cleaned_kwargs,
                )(func)

            except Exception as e:
                logger.warning(
                    "Could not create LangSmith trace wrapper for %s: %s",
                    func_name,
                    e,
                )

        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        return wrapper

    return decorator