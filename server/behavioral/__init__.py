"""
Felix — Behavioral Telemetry Pipeline (Part 2).

This package analyses learner video and audio captured during a live
interview-coaching session and produces a ``BehavioralSignalRecord``
that Part 3 (Learning Engine) uses for evidence-based feedback.

All analysis runs **asynchronously / post-turn** — it is never on the
live-turn critical path (the < 1.5 s latency budget belongs to Part 1).

Entry point
-----------
>>> from server.behavioral import BehavioralPipeline
>>> pipeline = BehavioralPipeline()
>>> record = await pipeline.analyze(handoff)
"""

from server.behavioral.pipeline import BehavioralPipeline  # noqa: F401

__all__ = ["BehavioralPipeline"]
