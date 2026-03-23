package com.mytelco.casebff.repository;

import com.mytelco.casebff.service.persistence.TroubleTicketEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TroubleTicketRepository extends JpaRepository<TroubleTicketEntity, UUID> {

    Optional<TroubleTicketEntity> findByExternalId(String externalId);

    @EntityGraph(attributePaths = "events")
    List<TroubleTicketEntity> findByCustomerIdOrderByCreatedAtDesc(String customerId);
}
