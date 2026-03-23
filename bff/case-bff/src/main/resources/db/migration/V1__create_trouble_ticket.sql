-- V1__create_trouble_ticket.sql
-- TMF646 Trouble Ticket Management - Case/Support entity

CREATE TABLE IF NOT EXISTS trouble_ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    customer_id VARCHAR(255) NOT NULL,
    affected_service_id VARCHAR(255),
    sla_target TIMESTAMP WITH TIME ZONE,
    expected_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trouble_ticket_customer ON trouble_ticket(customer_id);
CREATE INDEX IF NOT EXISTS idx_trouble_ticket_status ON trouble_ticket(status);
CREATE INDEX IF NOT EXISTS idx_trouble_ticket_category ON trouble_ticket(category);

-- Timeline/Comments table
CREATE TABLE IF NOT EXISTS trouble_ticket_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trouble_ticket_id UUID NOT NULL REFERENCES trouble_ticket(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    actor_type VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_event_ticket ON trouble_ticket_event(trouble_ticket_id);
