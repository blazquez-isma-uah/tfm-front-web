package com.tfm.bandas.events.dto;

import com.tfm.bandas.events.utils.EventStatus;
import com.tfm.bandas.events.utils.EventType;
import com.tfm.bandas.events.utils.EventVisibility;
import jakarta.validation.constraints.*;
import java.time.Instant;

public record EventCreateRequestDTO(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @Size(max = 255) String location,
        @NotNull EventType type,
        EventStatus status, // opcional; si null => SCHEDULED
        @NotNull EventVisibility visibility,

        @NotNull Instant startAt,
        @NotNull Instant endAt
) {}
