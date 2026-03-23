package com.mytelco.casebff.repository;

import com.mytelco.casebff.service.persistence.TroubleTicketEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TroubleTicketEventRepository extends JpaRepository<TroubleTicketEventEntity, UUID> {

    List<TroubleTicketEventEntity> findByTroubleTicket_IdOrderByCreatedAtAsc(UUID troubleTicketId);
}
