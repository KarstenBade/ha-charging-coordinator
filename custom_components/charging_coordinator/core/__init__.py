"""Pure control logic of the charging coordinator.

Nothing in this package may import Home Assistant. Everything here is driven by
plain dataclasses and an explicit `now` timestamp so it can be unit-tested with
a fake clock.
"""
