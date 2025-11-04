from typing import Optional
import os
import logging

from config.settings import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(
        self,
        preferred: str = settings.llm_preferred,
        openai_model: str = settings.openai_chat_model,
        gemini_model: str = settings.gemini_chat_model,
    ):
        self.preferred = preferred
        self.openai_model = openai_model
        self.gemini_model = gemini_model

    def _generate_openai(self, prompt: str) -> str:
        try:
            from openai import OpenAI
        except Exception as e:
            raise RuntimeError(f"OpenAI SDK not available: {e}")
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("Missing OPENAI_API_KEY")
        client = OpenAI(api_key=api_key)
        resp = client.chat.completions.create(
            model=self.openai_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return resp.choices[0].message.content or ""

    def _generate_gemini(self, prompt: str) -> str:
        try:
            import google.generativeai as genai
        except Exception as e:
            raise RuntimeError(f"Google Generative AI SDK not available: {e}")
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("Missing GOOGLE_API_KEY/GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(self.gemini_model)
        resp = model.generate_content(prompt)
        return (getattr(resp, "text", None) or resp.candidates[0].content.parts[0].text)

    def generate(self, prompt: str) -> str:
        providers = [self.preferred, "openai" if self.preferred == "gemini" else "gemini"]
        last_err: Optional[Exception] = None
        for p in providers:
            try:
                if p == "openai":
                    return self._generate_openai(prompt)
                else:
                    return self._generate_gemini(prompt)
            except Exception as e:
                logger.warning(f"LLM provider {p} failed: {e}")
                last_err = e
                continue
        raise RuntimeError(str(last_err) if last_err else "LLM generation failed")


