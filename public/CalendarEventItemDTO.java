package com.tfm.bandas.events.dto;

import com.tfm.bandas.events.utils.EventStatus;
import com.tfm.bandas.events.utils.EventType;

import java.time.Instant;

public record CalendarEventItemDTO(
    String id,
    String title,
    Instant start,
    Instant end,
    boolean allDay,
    EventType type,
    EventStatus status,
    String location
) {}
