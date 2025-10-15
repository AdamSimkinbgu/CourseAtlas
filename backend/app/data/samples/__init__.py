from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

from .models import SampleDefinition

SAMPLES_DIR = Path(__file__).parent


@lru_cache()
def load_samples() -> List[SampleDefinition]:
    samples: List[SampleDefinition] = []
    for path in sorted(SAMPLES_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        samples.append(SampleDefinition.model_validate(data))
    return samples


@lru_cache()
def samples_by_slug() -> Dict[str, SampleDefinition]:
    return {sample.slug: sample for sample in load_samples()}


def get_sample(slug: str) -> SampleDefinition:
    catalog = samples_by_slug()
    if slug not in catalog:
        raise KeyError(f"Unknown sample slug: {slug}")
    return catalog[slug]
