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

    def _generate_openai(self, prompt: str):
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
        text = resp.choices[0].message.content or ""
        usage = getattr(resp, "usage", None)
        usage_out = {
            "prompt_tokens": getattr(usage, "prompt_tokens", None) if usage else None,
            "completion_tokens": getattr(usage, "completion_tokens", None) if usage else None,
            "total_tokens": getattr(usage, "total_tokens", None) if usage else None,
        }
        return text, usage_out

    def _generate_gemini(self, prompt: str):
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
        text = (getattr(resp, "text", None) or resp.candidates[0].content.parts[0].text)
        um = getattr(resp, "usage_metadata", None)
        # usage_metadata fields: prompt_token_count, candidates_token_count, total_token_count
        usage_out = {
            "prompt_tokens": getattr(um, "prompt_token_count", None) if um else None,
            "completion_tokens": getattr(um, "candidates_token_count", None) if um else None,
            "total_tokens": getattr(um, "total_token_count", None) if um else None,
        }
        return text, usage_out

    def generate(self, prompt: str):
        providers = [self.preferred, "openai" if self.preferred == "gemini" else "gemini"]
        last_err: Optional[Exception] = None
        for p in providers:
            try:
                if p == "openai":
                    text, usage = self._generate_openai(prompt)
                    return text, usage, "openai"
                else:
                    text, usage = self._generate_gemini(prompt)
                    return text, usage, "gemini"
            except Exception as e:
                logger.warning(f"LLM provider {p} failed: {e}")
                last_err = e
                continue
        raise RuntimeError(str(last_err) if last_err else "LLM generation failed")


