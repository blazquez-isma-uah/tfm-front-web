package com.tfm.bandas.users.dto;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MyProfileUpdateRequestDTO(
    @Size(max = 100, message = "First name must not exceed 100 characters")
    String firstName,

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    String lastName,

    @Size(max = 100, message = "Second last name must not exceed 100 characters")
    String secondLastName,

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    String phone,

    @Size(max = 500, message = "Notes must not exceed 500 characters")
    String notes,

    @Size(max = 255, message = "Profile picture URL must not exceed 255 characters")
    String profilePictureUrl,

    @Past(message = "Birth date must be in the past")
    LocalDate birthDate
) {}

