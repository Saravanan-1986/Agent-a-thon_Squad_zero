"""
Multi-Model Engine (LLM Orchestration & Auto-Detection)

The Knowledge Debt Engine uses OpenRouter as its LLM gateway.
For the current demo, OpenRouter routes requests to Google's
Gemini 2.0 Flash Lite model (`google/gemini-2.0-flash-lite-001`).
The application receives a structured LLM evaluation, while
deterministic backend rules enforce the verification threshold
and state transition.

CURRENT DEMO EXECUTION PATH:
OpenRouter API key → OpenRouter → Google Gemini 2.0 Flash Lite model

OPTIONAL ALTERNATIVE:
Google Gemini API key → Google Gemini REST API directly
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("backend.services.multi_model_engine")

GEMINI_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001")


class MultiModelEngine:
    """
    Unified multi-model client with automatic provider detection, token budgeting,
    and deterministic offline evaluation fallback.
    """

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL)

    def is_configured(self) -> bool:
        """Returns True if a real LLM API key (Gemini or OpenRouter) is configured."""
        return bool(self.gemini_key or self.openrouter_key)

    def get_active_provider(self) -> str:
        if self.gemini_key:
            return "gemini"
        if self.openrouter_key:
            return "openrouter"
        return "deterministic_fallback"

    def get_status(self) -> Dict[str, Any]:
        provider = self.get_active_provider()
        model = self.gemini_model if provider == "gemini" else self.openrouter_model if provider == "openrouter" else "local_deterministic"
        mode_label = "REAL" if self.is_configured() else "OFFLINE"

        if provider == "openrouter":
            provider_label = "OpenRouter"
            model_name = "Google Gemini 2.0 Flash Lite" if self.openrouter_model == "google/gemini-2.0-flash-lite-001" else self.openrouter_model
            api_endpoint = OPENROUTER_URL
            display_badge = "OpenRouter → Gemini 2.0 Flash Lite (REAL)"
        elif provider == "gemini":
            provider_label = "Google Gemini API (Direct)"
            model_name = self.gemini_model
            api_endpoint = GEMINI_URL_TEMPLATE
            display_badge = "Gemini (REAL)"
        else:
            provider_label = "Deterministic Fallback"
            model_name = "Deterministic Engine"
            api_endpoint = "N/A"
            display_badge = "deterministic_fallback (OFFLINE)"

        return {
            "provider": provider_label,
            "active_provider": provider,
            "active_provider_label": provider_label,
            "model": model_name,
            "active_model": model_name,
            "model_id": model,
            "api": provider_label,
            "api_endpoint": api_endpoint,
            "mode": mode_label,
            "display_badge": display_badge,
            "gemini_available": bool(self.gemini_key),
            "openrouter_available": bool(self.openrouter_key),
            "fallback_enabled": True,
            "architecture_note": (
                "The Knowledge Debt Engine uses OpenRouter as its LLM gateway. "
                "For the current demo, OpenRouter routes requests to Google's "
                "Gemini 2.0 Flash Lite model (`google/gemini-2.0-flash-lite-001`). "
                "The application receives a structured LLM evaluation, while "
                "deterministic backend rules enforce the verification threshold "
                "and state transition."
            ),
            "core_principle": "LLM proposes. Evidence decides."
        }


    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 1200,
        temperature: float = 0.2
    ) -> Optional[Dict[str, Any]]:
        """
        Generates structured JSON using the active model provider with fallback chain:
        Gemini -> OpenRouter -> None (caller uses deterministic fallback template).
        """
        is_test_mode = os.getenv("KNOWLEDGE_DEBT_TEST_MODE", "").lower() in ["true", "1", "yes"]
        if is_test_mode:
            return None

        # 1. Primary: Google Gemini
        if self.gemini_key:
            try:
                url = GEMINI_URL_TEMPLATE.format(model=self.gemini_model, key=self.gemini_key)
                payload = {
                    "contents": [
                        {"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
                    ],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                        "responseMimeType": "application/json"
                    }
                }
                with httpx.Client(timeout=12.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
                            parsed = json.loads(raw_text)
                            logger.info("Gemini generated structured JSON (model=%s)", self.gemini_model)
                            return parsed
                    else:
                        logger.warning("Gemini HTTP %s: %s", resp.status_code, resp.text[:150])
            except Exception as e:
                logger.warning("Gemini API call failed: %s. Trying secondary provider.", e)

        # 2. Secondary: OpenRouter
        if self.openrouter_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.openrouter_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(OPENROUTER_URL, headers=headers, json=payload)
                    if resp.status_code == 200:
                        raw_text = resp.json()["choices"][0]["message"]["content"] or ""
                        raw_text = self._strip_markdown_code_block(raw_text)
                        parsed = json.loads(raw_text)
                        logger.info("OpenRouter generated structured JSON (model=%s)", self.openrouter_model)
                        return parsed
            except Exception as e:
                logger.warning("OpenRouter API call failed: %s. Reverting to deterministic fallback.", e)

        return None

    def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 400,
        temperature: float = 0.2
    ) -> Optional[str]:
        """
        Generates freeform text using the active model provider with fallback chain.
        """
        is_test_mode = os.getenv("KNOWLEDGE_DEBT_TEST_MODE", "").lower() in ["true", "1", "yes"]
        if is_test_mode:
            return None

        # 1. Primary: Google Gemini
        if self.gemini_key:
            try:
                url = GEMINI_URL_TEMPLATE.format(model=self.gemini_model, key=self.gemini_key)
                payload = {
                    "contents": [
                        {"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}
                    ],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens
                    }
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                        return raw_text
            except Exception as e:
                logger.warning("Gemini text generation failed: %s", e)

        # 2. Secondary: OpenRouter
        if self.openrouter_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.openrouter_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": self.openrouter_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                with httpx.Client(timeout=12.0) as client:
                    resp = client.post(OPENROUTER_URL, headers=headers, json=payload)
                    if resp.status_code == 200:
                        raw_text = resp.json()["choices"][0]["message"]["content"] or ""
                        return raw_text.strip()
            except Exception as e:
                logger.warning("OpenRouter text generation failed: %s", e)

        return None

    @staticmethod
    def _strip_markdown_code_block(text: str) -> str:
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        return text


# Global singleton instance
engine = MultiModelEngine()
