import base64
import json
import os

from openai import OpenAI

LLM_MODEL = "gpt-4o"

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


def _build_prompt(allowed_labels: dict[str, str]) -> str:
    lines = "\n".join(f"  - {k}: {v}" for k, v in allowed_labels.items())
    return (
        "You are a sushi counter. Look at the image and count exactly how many pieces of "
        "each sushi type are visible.\n\n"
        f"Allowed labels (use the snake_case name on the left):\n{lines}\n\n"
        "Counting rules:\n"
        "- Each individual piece counts as 1 unit. One nigiri = 1, one slice of sashimi = 1, "
        "one cut piece of a sushi roll = 1.\n"
        "- Only count items you can clearly see on the plate.\n"
        "- Do NOT count rice alone, ginger, wasabi, garnish, plates, or anything not in the labels.\n"
        "- If a sushi type is not present, omit it entirely from the result.\n\n"
        'Return JSON only: {"items": [{"name": "<label>", "quantity": <integer>}]}'
    )


def count_with_gpt4o(
    image_bytes: bytes,
    allowed_labels: dict[str, str],
) -> tuple[list[dict] | None, str | None]:
    if not os.environ.get("OPENAI_API_KEY"):
        return None, "OPENAI_API_KEY not set — see .env.example"

    img_b64 = base64.b64encode(image_bytes).decode("utf-8")
    schema = {
        "name": "sushi_count",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string", "enum": list(allowed_labels.keys())},
                            "quantity": {"type": "integer"},
                        },
                        "required": ["name", "quantity"],
                        "additionalProperties": False,
                    },
                }
            },
            "required": ["items"],
            "additionalProperties": False,
        },
    }

    try:
        resp = _get_client().chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": _build_prompt(allowed_labels)},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"},
                        },
                    ],
                }
            ],
            response_format={"type": "json_schema", "json_schema": schema},
            max_tokens=300,
        )
        data = json.loads(resp.choices[0].message.content)
        return data.get("items", []), None
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"
