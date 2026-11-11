"""Vehicles: a template per car says whether it is plugged in at home.

Car APIs (e.g. Tibber for VW) report with a delay, so two templates can be
true at once for a while. The car whose template turned true most recently is
taken as the connected one, and only while the charger itself reports a cable.
"""

from __future__ import annotations

import logging
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from homeassistant.config_entries import ConfigSubentry
from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import TemplateError
from homeassistant.helpers.event import (
    TrackTemplate,
    TrackTemplateResult,
    async_track_template_result,
)
from homeassistant.helpers.template import Template, result_as_boolean
from homeassistant.util import dt as dt_util

from .const import (
    CONF_VEHICLE_CONNECTED,
    CONF_VEHICLE_IMAGE,
    CONF_VEHICLE_IMAGE_ENTITY,
    CONF_VEHICLE_RANGE,
    CONF_VEHICLE_SOC,
    CONF_VEHICLE_TARGET_SOC,
)

_LOGGER = logging.getLogger(__name__)

IMAGE_UPLOAD_MEDIA = "media-source://image_upload/"
IMAGE_SERVE_URL = "/api/image/serve/"
IMAGE_SIZE = "512x512"


def picture_ref(value: Any) -> str | None:
    """The picked media's content id, or a picture URL saved by 0.4.2 and earlier."""
    if isinstance(value, dict):
        value = value.get("media_content_id")
    return value if isinstance(value, str) and value else None


def picture_url(ref: str | None) -> str | None:
    """A URL the browser can load without signing; None for media that must be resolved."""
    if not ref:
        return None
    if ref.startswith(IMAGE_UPLOAD_MEDIA):
        # uploaded images are served without authentication
        return f"{IMAGE_SERVE_URL}{ref.removeprefix(IMAGE_UPLOAD_MEDIA)}/{IMAGE_SIZE}"
    if ref.startswith("media-source://"):
        return None  # e.g. My media: the cards resolve it to a signed URL
    return ref


def media_value(value: Any) -> dict[str, str] | None:
    """The media picker's value for a stored picture, so reconfiguring keeps it."""
    if isinstance(value, dict):
        return value
    if isinstance(value, str) and value.startswith(IMAGE_SERVE_URL):
        image_id = value.removeprefix(IMAGE_SERVE_URL).split("/", 1)[0]
        return {
            "media_content_id": f"{IMAGE_UPLOAD_MEDIA}{image_id}",
            "media_content_type": "image",
        }
    return None


@dataclass(frozen=True)
class VehicleConfig:
    subentry_id: str
    name: str
    soc_entity: str
    connected_template: str
    target_soc_entity: str | None = None
    range_entity: str | None = None
    image_entity: str | None = None
    image: str | None = None  # media content id, or a picture URL

    @classmethod
    def from_subentry(cls, subentry: ConfigSubentry) -> VehicleConfig:
        data = subentry.data
        return cls(
            subentry_id=subentry.subentry_id,
            name=subentry.title,
            soc_entity=data[CONF_VEHICLE_SOC],
            connected_template=data[CONF_VEHICLE_CONNECTED],
            target_soc_entity=data.get(CONF_VEHICLE_TARGET_SOC) or None,
            range_entity=data.get(CONF_VEHICLE_RANGE) or None,
            image_entity=data.get(CONF_VEHICLE_IMAGE_ENTITY) or None,
            image=picture_ref(data.get(CONF_VEHICLE_IMAGE)),
        )


class VehicleTracker:
    """Follows one car's connected template."""

    def __init__(
        self, hass: HomeAssistant, config: VehicleConfig, on_change: Callable[[], None]
    ) -> None:
        self.hass = hass
        self.config = config
        self.connected = False
        self.connected_since: datetime | None = None
        self.error: str | None = None
        self._on_change = on_change
        self._evaluated = False
        self._restored_since: datetime | None = None

    @callback
    def async_start(self) -> CALLBACK_TYPE:
        template = Template(self.config.connected_template, self.hass)
        info = async_track_template_result(
            self.hass, [TrackTemplate(template, None)], self._on_result
        )
        info.async_refresh()
        return info.async_remove

    @callback
    def _on_result(
        self, _event: Event[EventStateChangedData] | None, updates: list[TrackTemplateResult]
    ) -> None:
        result = updates[-1].result
        if isinstance(result, TemplateError):
            if self.error is None:
                _LOGGER.warning("Connected template of %s failed: %s", self.config.name, result)
            self.error = str(result)
            self.set_connected(False)
        else:
            self.error = None
            self.set_connected(result_as_boolean(result))
        self._on_change()

    @callback
    def set_connected(self, connected: bool, now: datetime | None = None) -> None:
        if connected and not self.connected:
            # after a restart the stored time is kept, otherwise every car would be "newest"
            self.connected_since = self._restored_since or now or dt_util.utcnow()
        elif not connected:
            self.connected_since = None
        self.connected = connected
        self._evaluated = True
        self._restored_since = None

    @callback
    def restore(self, since: datetime) -> None:
        """Reuse the time from before a restart if the car is (still) connected."""
        if not self._evaluated:
            self._restored_since = since
        elif self.connected and self.connected_since is not None and since < self.connected_since:
            self.connected_since = since

    def picture(self) -> str | None:
        """The image entity's picture (its URL carries a rotating token), else the picked one."""
        if self.config.image_entity:
            state = self.hass.states.get(self.config.image_entity)
            picture = state.attributes.get("entity_picture") if state else None
            if picture:
                return str(picture)
        return picture_url(self.config.image)

    def as_dict(self) -> dict[str, Any]:
        c = self.config
        return {
            "name": c.name,
            "connected": self.connected,
            "connected_since": self.connected_since.isoformat() if self.connected_since else None,
            "soc_entity": c.soc_entity,
            "target_soc_entity": c.target_soc_entity,
            "range_entity": c.range_entity,
            "image_entity": c.image_entity,
            "image": picture_url(c.image),
            # media the cards resolve to a signed URL themselves
            "image_media": c.image if c.image and picture_url(c.image) is None else None,
        }


def pick_connected(
    trackers: Iterable[VehicleTracker], charger_connected: bool
) -> VehicleTracker | None:
    """The car on the cable: the newest connected template, if the charger has a car."""
    if not charger_connected:
        return None
    candidates = [t for t in trackers if t.connected and t.connected_since is not None]
    return max(candidates, key=lambda t: t.connected_since or dt_util.utcnow(), default=None)
