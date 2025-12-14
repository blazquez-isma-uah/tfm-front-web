package com.tfm.bandas.events.dto;

import com.tfm.bandas.events.utils.EventStatus;
import com.tfm.bandas.events.utils.EventType;
import com.tfm.bandas.events.utils.EventVisibility;

import java.time.Instant;

public record EventDTO(
    String id,
    int version,
    String title,
    String description,
    String location,
    EventType type,
    EventStatus status,
    EventVisibility visibility,
    Instant startAt,
    Instant endAt
) {}
