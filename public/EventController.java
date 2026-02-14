package com.tfm.bandas.events.controller;

import com.tfm.bandas.events.dto.CalendarEventItemDTO;
import com.tfm.bandas.events.dto.EventCreateRequestDTO;
import com.tfm.bandas.events.dto.EventDTO;
import com.tfm.bandas.events.service.EventService;
import com.tfm.bandas.events.utils.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/events")
public class EventController {

    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
    private final EventService eventService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<EventDTO> createEvent(@Valid @RequestBody EventCreateRequestDTO event) {
        logger.info("Calling createEvent with arguments: {}", event);
        EventDTO response = eventService.createEvent(event);
        logger.info("createEvent returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.status(HttpStatus.CREATED), response.version(), response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{eventId}")
    public ResponseEntity<EventDTO> updateEvent(@PathVariable String eventId, @Valid @RequestBody EventCreateRequestDTO event,
                                                @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        logger.info("Calling updateEvent with eventId={}, event={}, ifMatch={}", eventId, event, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        EventDTO response = eventService.updateEvent(eventId, event, version);
        logger.info("updateEvent returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String eventId,
                                            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        logger.info("Calling deleteEvent with idEvent={}, ifMatch={}", eventId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        eventService.deleteEvent(eventId, version);
        logger.info("deleteEvent Completed successfully");
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @GetMapping("/{eventId}")
    public ResponseEntity<EventDTO> getEvent(@PathVariable String eventId) {
        logger.info("Calling getEvent with idEvent={}", eventId);
        EventDTO response = eventService.getEvent(eventId);
        logger.info("getEvent returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    // Listado por rango (UTC)
    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @GetMapping
    public ResponseEntity<PaginatedResponse<EventDTO>> listBetweenEvents(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        logger.info("Calling listBetweenEvents with from={}, to={}, pageable={}", from, to, pageable);
        PaginatedResponse<EventDTO> response = PaginatedResponse.from(eventService.listEventsBetween(from, to, pageable));
        logger.info("listBetweenEvents returning: {}", response);
        return ResponseEntity.ok(response);
    }

    // Pasados (por endAt)
    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @GetMapping("/past")
    public ResponseEntity<PaginatedResponse<EventDTO>> listPastEvents(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant before,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        logger.info("Calling listPastEvents with before={}, pageable={}", before, pageable);
        PaginatedResponse<EventDTO> response = PaginatedResponse.from(eventService.listEventsPast(before != null ? before : Instant.now(), pageable));
        logger.info("listPastEvents returning: {}", response);
        return ResponseEntity.ok(response);
    }

    // Vista calendario (payload ligero)
    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @GetMapping("/calendar")
    public ResponseEntity<PaginatedResponse<CalendarEventItemDTO>> getPrivateCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        logger.info("Calling getPrivateCalendar with from={}, to={}, pageable={}", from, to, pageable);
        PaginatedResponse<CalendarEventItemDTO> response = PaginatedResponse.from(eventService.calendarBetween(from, to, pageable));
        logger.info("getPrivateCalendar returning: {}", response);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/public/calendar")
    public ResponseEntity<PaginatedResponse<CalendarEventItemDTO>> getPublicCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        logger.info("Calling getPublicCalendar with from={}, to={}, pageable={}", from, to, pageable);
        PaginatedResponse<CalendarEventItemDTO> response = PaginatedResponse.from(eventService.calendarBetweenPublic(from, to, pageable));
        logger.info("getPublicCalendar returning: {}", response);
        return ResponseEntity.ok(response);
    }


    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/search")
    public ResponseEntity<PaginatedResponse<EventDTO>> searchEvents(
            // Texto libre en title/description/location
            @RequestParam(required = false, name = "q") String qText,
            // Filtros específicos
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) EventType type,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) EventVisibility visibility,
            // Paginación / ordenación
            @PageableDefault(size = 20, sort = "startAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
      logger.info("Calling searchEvents with qText={}, title={}, description={}, location={}, type={}, status={}, visibility={}, pageable={}",
              qText, title, description, location, type, status, visibility, pageable);
      PaginatedResponse<EventDTO> response = PaginatedResponse.from(eventService.searchEvents(
              qText, title, description, location, type, status, visibility, pageable
      ));
        logger.info("searchEvents returning: {}", response);
      return ResponseEntity.ok(response);
    }

    // Placeholder para partituras (hasta que exista el micro de Partituras)
    @GetMapping("/{eventId}/scores")
    public ResponseEntity<PaginatedResponse<Object>> scoresPlaceholder(@PathVariable String eventId) {
        return ResponseEntity.ok(PaginatedResponse.from(Page.empty())); // devolvemos lista vacía; luego lo integraremos
    }

    // Get lista de tipos de evento
    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/available-types")
    public ResponseEntity<EventType[]> getEventTypes() {
        return ResponseEntity.ok(EventType.values());
    }

    // Get lista de estados de evento
    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/available-statuses")
    public ResponseEntity<EventStatus[]> getEventStatuses() {
        return ResponseEntity.ok(EventStatus.values());
    }

    // Get lista de visibilidades de evento
    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/available-visibilities")
    public ResponseEntity<EventVisibility[]> getEventVisibilities() {
      return ResponseEntity.ok(EventVisibility.values());
    }

}
