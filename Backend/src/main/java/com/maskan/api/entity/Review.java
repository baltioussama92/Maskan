package com.maskan.api.entity;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "reviews")
public class Review {

    @Id
    private String id;

    @NotNull
    @Indexed
    @Field("propertyId")
    private String propertyId;

    @NotNull
    @Indexed
    private String authorId;

    @NotNull
    private String authorName;

    @NotNull
    @Min(1)
    @Max(5)
    private int rating;

    @Size(max = 1000)
    private String comment;

    @Builder.Default
    private Instant createdAt = Instant.now();
}

