"""
Multi-Model Engine (LLM Orchestration & Auto-Detection)

Supports:
1. Google Gemini REST API (gemini-flash-lite-latest, gemini-flash-latest, etc.) via GEMINI_API_KEY
2. OpenRouter API via OPENROUTER_API_KEY
3. High-fidelity deterministic fallback guaranteeing 100% pitch and test stability offline

Auto-detection selects Gemini first if GEMINI_API_KEY is configured, OpenRouter second,
and falls back to deterministic zero-crash templates if network or credits are unavailable.
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
    and zero-crash deterministic fallback.
    """

    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)
        self.openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        self.openrouter_model = os.getenv("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL)

    def get_active_provider(self) -> str:
        if self.gemini_key:
            return "gemini"
        if self.openrouter_key:
            return "openrouter"
        return "deterministic_fallback"

    def get_status(self) -> Dict[str, Any]:
        provider = self.get_active_provider()
        model = self.gemini_model if provider == "gemini" else self.openrouter_model if provider == "openrouter" else "local_deterministic"
        return {
            "active_provider": provider,
            "active_model": model,
            "gemini_available": bool(self.gemini_key),
            "openrouter_available": bool(self.openrouter_key),
            "fallback_enabled": True,
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
