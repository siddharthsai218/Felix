"""
Generates synthetic audio and metadata fixtures for testing without dependencies.
"""

import json
import math
import os
import struct
import wave


def generate_sine_wave_wav(filepath: str, duration_s: float = 3.0, sample_rate: int = 16000, freq: float = 440.0):
    n_samples = int(duration_s * sample_rate)
    with wave.open(filepath, "w") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        data = bytearray()
        for i in range(n_samples):
            # Introduce a silent pause in the middle
            t = i / sample_rate
            if 1.0 <= t <= 1.8:
                val = 0
            else:
                val = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * freq * t))
            data.extend(struct.pack("<h", val))
        wav_file.writeframes(data)


def generate_fixture_data(out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    wav_path = os.path.join(out_dir, "sample_response.wav")
    generate_sine_wave_wav(wav_path, duration_s=3.0)

    handoff_dict = {
        "session_id": "sess_demo_123",
        "learner_id": "learner_456",
        "response_id": "resp_001",
        "response_start_ts": "2026-10-10T15:00:00Z",
        "response_end_ts": "2026-10-10T15:00:03Z",
        "audio_path": wav_path,
        "video_frames_dir": None,
        "stt_words": [
            {"word": "When", "start_s": 0.1, "end_s": 0.4, "confidence": 0.98},
            {"word": "the", "start_s": 0.45, "end_s": 0.6, "confidence": 0.99},
            {"word": "database", "start_s": 0.65, "end_s": 0.95, "confidence": 0.95},
            {"word": "crashed", "start_s": 1.9, "end_s": 2.4, "confidence": 0.96},
            {"word": "yesterday", "start_s": 2.45, "end_s": 2.9, "confidence": 0.97},
        ],
    }

    with open(os.path.join(out_dir, "sample_handoff.json"), "w") as f:
        json.dump(handoff_dict, f, indent=2)


if __name__ == "__main__":
    generate_fixture_data(os.path.dirname(__file__))
    print("Fixtures generated successfully.")
