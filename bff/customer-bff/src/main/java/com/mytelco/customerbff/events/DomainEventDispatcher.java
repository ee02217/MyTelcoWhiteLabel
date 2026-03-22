package com.mytelco.customerbff.events;

public interface DomainEventDispatcher {

    void dispatch(DomainEventEnvelope eventEnvelope);
}
