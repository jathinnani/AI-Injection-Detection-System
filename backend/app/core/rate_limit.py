import time
from collections import defaultdict
from threading import Lock

class RateLimiter:
    def __init__(self, limit: int = 30, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self._buckets: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            bucket = [stamp for stamp in self._buckets[key] if now - stamp < self.window_seconds]
            if len(bucket) >= self.limit:
                self._buckets[key] = bucket
                return False
            bucket.append(now)
            self._buckets[key] = bucket
            return True

limiter = RateLimiter()
