package com.tfm.bandas.surveys.controller;

import com.tfm.bandas.surveys.dto.*;
import com.tfm.bandas.surveys.service.SurveyResponseService;
import com.tfm.bandas.surveys.service.SurveyService;
import com.tfm.bandas.surveys.utils.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/surveys")
public class SurveyController {

    private static final Logger logger = LoggerFactory.getLogger(SurveyController.class);
    private final SurveyService surveyService;
    private final SurveyResponseService surveyResponseService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SurveyDTO> createSurvey(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateSurveyRequestDTO createSurveyRequestDTO) {
        logger.info("Calling createSurvey with arguments: {}", createSurveyRequestDTO);
        String userId = jwt.getSubject();
        SurveyDTO response = surveyService.createSurvey(createSurveyRequestDTO, userId);
        logger.info("createSurvey by userId={} returning: {}", userId, response);
        return EtagUtils.withEtag(ResponseEntity.status(HttpStatus.CREATED), response.version(), response);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @GetMapping("/{surveyId}")
    public ResponseEntity<SurveyDTO> getSurveyById(@PathVariable String surveyId) {
        logger.info("Calling getSurveyById with surveyId={}", surveyId);
        SurveyDTO response = surveyService.getSurveyById(surveyId);
        logger.info("getSurveyById returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{surveyId}")
    public ResponseEntity<Void> deleteSurvey(@RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
                                             @PathVariable String surveyId) {
        logger.info("Calling deleteSurvey with surveyId={}, ifMatch={}", surveyId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        surveyService.deleteSurvey(surveyId, version);
        logger.info("deleteSurvey Completed successfully for surveyId={}", surveyId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{idSurvey}")
    public ResponseEntity<SurveyDTO> updateSurvey(
            @PathVariable String idSurvey,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody UpdateSurveyRequestDTO dto) {
        logger.info("Calling updateSurvey with arguments: idSurvey={}, dto={}, ifMatch={}", idSurvey, dto, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        SurveyDTO updated = surveyService.updateSurvey(idSurvey, version, dto);
        logger.info("updateSurvey returning: {}", updated);
        return EtagUtils.withEtag(ResponseEntity.ok(), updated.version(), updated);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{surveyId}/open")
    public ResponseEntity<SurveyDTO> openSurvey(@RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
                                                @PathVariable String surveyId) {
        logger.info("Calling openSurvey with surveyId={}, ifMatch={}", surveyId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        SurveyDTO response = surveyService.openSurvey(surveyId, version);
        logger.info("openSurvey Completed successfully for survey={}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{surveyId}/close")
    public ResponseEntity<SurveyDTO> closeSurvey(@RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
                                                 @PathVariable String surveyId) {
        logger.info("Calling closeSurvey with surveyId={}, ifMatch={}", surveyId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        SurveyDTO response = surveyService.closeSurvey(surveyId, version);
        logger.info("closeSurvey Completed successfully for survey={}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{surveyId}/cancel")
    public ResponseEntity<SurveyDTO> cancelSurvey(@RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
                                                  @PathVariable String surveyId) {
        logger.info("Calling cancelSurvey with surveyId={}, ifMatch={}", surveyId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        SurveyDTO response = surveyService.cancelSurvey(surveyId, version);
        logger.info("cancelSurvey Completed successfully for survey={}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @GetMapping("/listOpen/{eventId}")
    public ResponseEntity<PaginatedResponse<SurveyDTO>> listOpenSurveyByEventId(@PathVariable String eventId
            , @PageableDefault(size = 10) Pageable pageable) {
        logger.info("Calling listOpenSurveyByEventId with eventId={}", eventId);
        PaginatedResponse<SurveyDTO> response = PaginatedResponse.from(
                surveyService.listOpenSurveysForEvent(eventId, pageable));
        logger.info("listOpenSurveyByEventId returning {} surveys for eventId={}", response.size(), eventId);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @GetMapping("/listAll/{eventId}")
    public ResponseEntity<PaginatedResponse<SurveyDTO>> listAllSurveyByEventId(@PathVariable String eventId
            , @PageableDefault(size = 10) Pageable pageable) {
        logger.info("Calling listAllSurveyByEventId with eventId={}", eventId);
        PaginatedResponse<SurveyDTO> response = PaginatedResponse.from(
                surveyService.listAllSurveysForEvent(eventId, pageable));
        logger.info("listAllSurveyByEventId returning {} surveys for eventId={}", response.size(), eventId);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/search")
    public ResponseEntity<PaginatedResponse<SurveyDTO>> search(
            @RequestParam(required = false) String qText,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String eventId,
            @RequestParam(required = false) SurveyStatus status,
            @RequestParam(required = false) SurveyType surveyType,
            @RequestParam(required = false) Instant opensFrom,
            @RequestParam(required = false) Instant opensTo,
            @RequestParam(required = false) Instant closesFrom,
            @RequestParam(required = false) Instant closesTo,
            Pageable pageable) {
        logger.info("Calling search with qText={}, title={}, description={}, eventId={}, status={}, surveyType={}, opensFrom={}, opensTo={}, closesFrom={}, closesTo={}, pageable={}",
                qText, title, description, eventId, status, surveyType, opensFrom, opensTo, closesFrom, closesTo, pageable);
        PaginatedResponse<SurveyDTO> response = PaginatedResponse.from(
                surveyService.searchSurveys(qText, title, description, eventId, status, surveyType, opensFrom, opensTo, closesFrom, closesTo, pageable));
        logger.info("search returning {} surveys", response.size());
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/answered/me")
    public ResponseEntity<PaginatedResponse<SurveyDTO>> listMyAnsweredSurveys(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) SurveyStatus status,
            @RequestParam(required = false) SurveyType surveyType,
            @RequestParam(required = false) Instant opensFrom,
            @RequestParam(required = false) Instant opensTo,
            @RequestParam(required = false) Instant closesFrom,
            @RequestParam(required = false) Instant closesTo,
            @PageableDefault(size = 10) Pageable pageable) {
        String userId = jwt.getSubject();
        logger.info("Calling listMyAnsweredSurveys for userId={}, status={}, surveyType={}, opensFrom={}, opensTo={}, closesFrom={}, closesTo={}",
                userId, status, surveyType, opensFrom, opensTo, closesFrom, closesTo);
        PaginatedResponse<SurveyDTO> response = PaginatedResponse.from(
                surveyService.listSurveysAnsweredByUser(userId, status, surveyType, opensFrom, opensTo, closesFrom, closesTo, pageable));
        logger.info("listMyAnsweredSurveys returning {} surveys for userId={}", response.size(), userId);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/notAnswered/me")
    public ResponseEntity<PaginatedResponse<SurveyDTO>> listMyNotAnsweredSurveys(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) SurveyStatus status,
            @RequestParam(required = false) SurveyType surveyType,
            @RequestParam(required = false) Instant opensFrom,
            @RequestParam(required = false) Instant opensTo,
            @RequestParam(required = false) Instant closesFrom,
            @RequestParam(required = false) Instant closesTo,
            @PageableDefault(size = 10) Pageable pageable) {
        String userId = jwt.getSubject();
        logger.info("Calling listMyNotAnsweredSurveys for userId={}, status={}, surveyType={}, opensFrom={}, opensTo={}, closesFrom={}, closesTo={}",
                userId, status, surveyType, opensFrom, opensTo, closesFrom, closesTo);
        PaginatedResponse<SurveyDTO> response = PaginatedResponse.from(
                surveyService.listSurveysNotAnsweredByUser(userId, status, surveyType, opensFrom, opensTo, closesFrom, closesTo, pageable));
        logger.info("listMyNotAnsweredSurveys returning {} surveys for userId={}", response.size(), userId);
        return ResponseEntity.ok(response);
    }

    // -------------------- Survey Responses ------------------- //


    @PreAuthorize("hasAnyRole('ADMIN', 'MUSICIAN')")
    @PostMapping("/responses/{surveyId}")
    public ResponseEntity<SurveyResponseDTO> respondToSurvey(@AuthenticationPrincipal Jwt jwt
            , @PathVariable String surveyId,@Valid @RequestBody RespondYesNoMaybeRequestDTO respondYesNoMaybeRequestDTO) {
        logger.info("Calling respondToSurvey with surveyId={}, respondYesNoMaybeRequestDTO={}", surveyId, respondYesNoMaybeRequestDTO);
        String userId = jwt.getSubject();
        SurveyResponseDTO response = surveyResponseService.respondYesNoMaybeToSurvey(surveyId, userId, respondYesNoMaybeRequestDTO);
        logger.info("respondToSurvey by userId={} returning: {}", userId, response);
        return EtagUtils.withEtag(ResponseEntity.status(HttpStatus.CREATED), response.version(), response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/responses/yesNoMaybeResults/{surveyId}")
    public ResponseEntity<Map<YesNoMaybeAnswer, Long>> resultsYesNoMaybeOfSurvey(@PathVariable String surveyId) {
        logger.info("Calling getSurveyResults with surveyId={}", surveyId);
        Map<YesNoMaybeAnswer, Long> response = surveyResponseService.resultsYesNoMaybeOfSurvey(surveyId);
        logger.info("getSurveyResults returning: {}", response);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/responses/completeResults/{surveyId}")
    public ResponseEntity<PaginatedResponse<SurveyResponseDTO>> completeResultsOfSurvey(@PathVariable String surveyId
            , @PageableDefault(size = 10) Pageable pageable) {
        logger.info("Calling completeResultsOfSurvey with surveyId={}", surveyId);
        PaginatedResponse<SurveyResponseDTO> response = PaginatedResponse.from(
                surveyResponseService.completeResultsOfSurvey(surveyId, pageable));
        logger.info("completeResultsOfSurvey returning {} responses for surveyId={}", response.size(), surveyId);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/responses/{surveyId}/me")
    public ResponseEntity<SurveyResponseDTO> findMyResponse(
            @PathVariable String surveyId,
            @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getSubject();
        logger.info("Calling getMy with surveyId={} for userId={}", surveyId, userId);
        SurveyResponseDTO response = surveyResponseService.findMyResponse(surveyId, userId);
        logger.info("getMy returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @PutMapping("/responses/{surveyId}/me")
    public ResponseEntity<SurveyResponseDTO> updateMyResponse(
            @PathVariable String surveyId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody UpdateSurveyResponseRequestDTO bodyDto) {
        String userId = jwt.getSubject();
        logger.info("Calling updateMyResponse with surveyId={} for userId={}, bodyDto={}, ifMatch={}", surveyId, userId, bodyDto, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        SurveyResponseDTO updated = surveyResponseService.updateMyResponse(surveyId, userId, version, bodyDto);
        logger.info("updateMyResponse returning: {}", updated);
        return EtagUtils.withEtag(ResponseEntity.ok(), updated.version(), updated);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @DeleteMapping("/responses/{surveyId}/me")
    public ResponseEntity<Void> deleteMyResponse(
            @PathVariable String surveyId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        String userId = jwt.getSubject();
        logger.info("Calling deleteMyResponse with surveyId={} for userId={}, ifMatch={}", surveyId, userId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        surveyResponseService.deleteMyResponse(surveyId, userId, version);
        logger.info("deleteMyResponse completed successfully for surveyId={} and userId={}", surveyId, userId);
        return ResponseEntity.noContent().build();
    }

    // -------------------- Admin User Responses ------------------- //
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/responses/{surveyId}/user/{targetUserId}")
    public ResponseEntity<SurveyResponseDTO> updateUserResponse(
            @PathVariable String surveyId,
            @PathVariable String targetUserId,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @Valid @RequestBody UpdateSurveyResponseRequestDTO bodyDto) {
        logger.info("Calling updateUserResponse with surveyId={} for targetUserId={}, bodyDto={}, ifMatch={}", surveyId, targetUserId, bodyDto, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        SurveyResponseDTO updated = surveyResponseService.updateUserResponse(surveyId, targetUserId, version, bodyDto);
        logger.info("updateUserResponse returning: {}", updated);
        return EtagUtils.withEtag(ResponseEntity.ok(), updated.version(), updated);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/responses/{surveyId}/user/{targetUserId}")
    public ResponseEntity<Void> deleteUserResponse(
            @PathVariable String surveyId,
            @PathVariable String targetUserId,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        logger.info("Calling deleteUserResponse with surveyId={} for targetUserId={}, ifMatch={}", surveyId, targetUserId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        surveyResponseService.deleteUserResponse(surveyId, targetUserId, version);
        logger.info("deleteUserResponse completed successfully for surveyId={} and targetUserId={}", surveyId, targetUserId);
        return ResponseEntity.noContent().build();
    }

    // Get lista de tipos de respuesta
    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/available-responseTypes")
    public ResponseEntity<ResponseType[]> getResponseTypes() {
        return ResponseEntity.ok(ResponseType.values());
    }

    // Get lista de tipos de respuesta YesNoMaybe
    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/available-yesNoMaybeAnswers")
    public ResponseEntity<YesNoMaybeAnswer[]> getYesNoMaybeAnswers() {
        return ResponseEntity.ok(YesNoMaybeAnswer.values());
    }

    // Get lista de estados de encuesta
    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/available-statuses")
    public ResponseEntity<SurveyStatus[]> getSurveyStatuses() {
        return ResponseEntity.ok(SurveyStatus.values());
    }

    // Get lista de tipos de encuesta
    @PreAuthorize("hasAnyRole('ADMIN','MUSICIAN')")
    @GetMapping("/available-surveyTypes")
    public ResponseEntity<SurveyType[]> getSurveyTypes() {
        return ResponseEntity.ok(SurveyType.values());
    }

}
