"""Delay timer with an explicit "elapsed" state (evcc pvTimer semantics)."""

from __future__ import annotations


class DelayTimer:
    """Timer that is either stopped, running since a timestamp, or forced elapsed.

    The forced elapsed state makes the next check pass immediately, e.g. right
    after a vehicle was connected so the first decision is not delayed.
    """

    def __init__(self) -> None:
        self._started: float | None = None
        self._forced = False

    @property
    def running(self) -> bool:
        return self._forced or self._started is not None

    def start(self, now: float) -> None:
        if not self.running:
            self._started = now

    def reset(self) -> None:
        self._started = None
        self._forced = False

    def elapse(self) -> None:
        self._started = None
        self._forced = True

    def elapsed(self, now: float, delay: float) -> bool:
        if self._forced:
            return True
        return self._started is not None and now - self._started >= delay

    def remaining(self, now: float, delay: float) -> float:
        if self._forced or self._started is None:
            return 0.0
        return max(0.0, delay - (now - self._started))
