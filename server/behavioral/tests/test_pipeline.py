from pathlib import Path
import json
import pytest
from server.behavioral.models import CaptureHandoff
from server.behavioral.pipeline import BehavioralPipeline


def test_pipeline_fixture_execution():
    fixtures_dir = Path(__file__).parent.parent / "fixtures"
    handoff_json_path = fixtures_dir / "sample_handoff.json"

    assert handoff_json_path.exists()

    with open(handoff_json_path) as f:
        data = json.load(f)

    handoff = CaptureHandoff(**data)
    pipeline = BehavioralPipeline()
    record = pipeline.analyze_sync(handoff)

    assert record.session_id == "sess_demo_123"
    assert record.response_id == "resp_001"
    assert record.prosody is not None
    assert record.gaze is not None
    assert record.facial is not None
    # Pauses should be detected between word 'database' (0.95s) and 'crashed' (1.9s)
    assert len(record.prosody.pause_segments) >= 1
