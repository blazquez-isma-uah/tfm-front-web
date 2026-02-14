package com.tfm.bandas.users.controller;

import com.tfm.bandas.users.dto.UserCreateRequestDTO;
import com.tfm.bandas.users.dto.UserDTO;
import com.tfm.bandas.users.dto.UserUpdateRequestDTO;
import com.tfm.bandas.users.dto.PasswordUpdateRequestDTO;
import com.tfm.bandas.users.dto.MyProfileUpdateRequestDTO;
import com.tfm.bandas.users.service.UserService;
import com.tfm.bandas.users.utils.EtagUtils;
import com.tfm.bandas.users.utils.PaginatedResponse;
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
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private final UserService userService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<UserDTO>> getAllUsers(@PageableDefault(size = 10) Pageable pageable) {
        logger.info("Calling getAllUsers with pageable: {}", pageable);
        PaginatedResponse<UserDTO> response = PaginatedResponse.from(userService.getAllUsers(pageable));
        logger.info("getAllUsers returning: {}", response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long userId) {
        logger.info("Calling getUserById with userId: {}", userId);
        UserDTO response = userService.getUserById(userId);
        logger.info("getUserById returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        logger.info("Calling getUserByEmail with email: {}", email);
        UserDTO response = userService.getUserByEmail(email);
        logger.info("getUserByEmail returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<UserDTO> getUserByUsername(@PathVariable String username) {
        logger.info("Calling getUserByUsername with username: {}", username);
        UserDTO response = userService.getUserByUsername(username);
        logger.info("getUserByUsername returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    // get user by iamId solo para admin
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/iam/{iamId}")
    public ResponseEntity<UserDTO> getUserByIamId(@PathVariable String iamId) {
        logger.info("Calling getUserByIamId with iamId: {}", iamId);
        UserDTO response = userService.getUserByIamId(iamId);
        logger.info("getUserByIamId returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody @Valid UserCreateRequestDTO dto) {
        logger.info("Calling createUser with userCreateDTO: {}", dto);
        UserDTO response = userService.createUser(dto);
        logger.info("createUser returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.status(HttpStatus.CREATED), response.version(), response);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long userId, @RequestBody @Valid UserUpdateRequestDTO dto,
                                              @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        logger.info("Calling updateUser with userId: {} and dto: {}, ifMatch: {}", userId, dto, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        UserDTO response = userService.updateUser(userId, dto, version);
        logger.info("updateUser returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId,
                                           @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        logger.info("Calling deleteUser with userId: {}, ifMatch: {}", userId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        userService.deleteUser(userId, version);
        logger.info("deleteUser completed for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/disable")
    public ResponseEntity<Void> disableUser(@PathVariable Long userId,
                                            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        logger.info("Calling disableUser with userId: {}, ifMatch: {}", userId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        userService.disableUser(userId, version);
        logger.info("disableUser completed for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/enable")
    public ResponseEntity<Void> enableUser(@PathVariable Long userId,
                                           @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch) {
        logger.info("Calling enableUser with userId: {}, ifMatch: {}", userId, ifMatch);
        int version = EtagUtils.parseIfMatchToVersion(ifMatch);
        userService.enableUser(userId, version);
        logger.info("enableUser completed for userId: {}", userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<PaginatedResponse<UserDTO>> searchUsers(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String secondLastName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Long instrumentId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate birthDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate birthDateTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bandJoinDateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate bandJoinDateTo,
            @PageableDefault(size = 10) Pageable pageable) {

        logger.info("Calling searchUsers with username: {}, firstName: {}, lastName: {}, email: {}, active: {}, instrumentId: {}, role:{}, birthDateFrom: {}, birthDateTo: {}, bandJoinDateFrom: {}, bandJoinDateTo: {}, pageable: {}",
                username, firstName, lastName, email, active, instrumentId, role, birthDateFrom, birthDateTo, bandJoinDateFrom, bandJoinDateTo, pageable);
        PaginatedResponse<UserDTO> response = PaginatedResponse.from(
                userService.searchUsers(username, firstName, lastName, secondLastName, email, active, instrumentId, role,
                        birthDateFrom, birthDateTo, bandJoinDateFrom, bandJoinDateTo, pageable)
        );
        logger.info("searchUsers returning: {}", response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        logger.info("Calling getMyProfile");
        // El claim "sub" de JWT es el que corresponde al iamId
        String iamId = jwt.getSubject();
        UserDTO response = userService.getUserByIamId(iamId);
        logger.info("getMyProfile returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserDTO> updateMyProfile(@AuthenticationPrincipal Jwt jwt,
                                                    @RequestBody @Valid MyProfileUpdateRequestDTO dto) {
        logger.info("Calling updateMyProfile with dto: {}", dto);
        // El claim "sub" de JWT es el que corresponde al iamId
        String iamId = jwt.getSubject();
        UserDTO response = userService.updateMyProfile(iamId, dto);
        logger.info("updateMyProfile returning: {}", response);
        return EtagUtils.withEtag(ResponseEntity.ok(), response.version(), response);
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> updateMyPassword(@AuthenticationPrincipal Jwt jwt,
                                                  @RequestBody @Valid PasswordUpdateRequestDTO dto) {
        logger.info("Calling updateMyPassword");
        // El claim "sub" de JWT es el que corresponde al iamId
        String iamId = jwt.getSubject();
        userService.updateMyPassword(iamId, dto.newPassword());
        logger.info("updateMyPassword completed for iamId: {}", iamId);
        return ResponseEntity.noContent().build();
    }
}
