package com.mytelco.customerbff.service.persistence;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

@Component
public class JsonFileDurableStateStore implements DurableStateStore {

    private static final Logger LOGGER = LoggerFactory.getLogger(JsonFileDurableStateStore.class);

    private final ObjectMapper objectMapper;
    private final Path storageDir;
    private final Map<String, Object> fileLocks = new ConcurrentHashMap<>();

    public JsonFileDurableStateStore(
        ObjectMapper objectMapper,
        @Value("${mytelco.state.storage-dir:data/customer-bff}") String storageDir
    ) {
        this.objectMapper = objectMapper;
        this.storageDir = Path.of(storageDir);
        createStorageDirIfNeeded();
    }

    @Override
    public <T> T read(String stateKey, TypeReference<T> typeReference, Supplier<T> defaultSupplier) {
        Path target = pathFor(stateKey);
        Object fileLock = lockFor(stateKey);

        synchronized (fileLock) {
            if (!Files.exists(target)) {
                return defaultSupplier.get();
            }
            try {
                return objectMapper.readValue(target.toFile(), typeReference);
            } catch (IOException ex) {
                LOGGER.warn("Failed to read state {} from {}. Falling back to defaults.", stateKey, target, ex);
                return defaultSupplier.get();
            }
        }
    }

    @Override
    public void write(String stateKey, Object payload) {
        Path target = pathFor(stateKey);
        Path tmp = target.resolveSibling(target.getFileName() + ".tmp");
        Object fileLock = lockFor(stateKey);

        synchronized (fileLock) {
            try {
                createStorageDirIfNeeded();
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(tmp.toFile(), payload);
                try {
                    Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                } catch (IOException atomicMoveFailure) {
                    Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException ex) {
                LOGGER.error("Failed to persist state {} to {}", stateKey, target, ex);
            }
        }
    }

    private Path pathFor(String stateKey) {
        return storageDir.resolve(stateKey + ".json");
    }

    private Object lockFor(String stateKey) {
        return fileLocks.computeIfAbsent(stateKey, ignored -> new Object());
    }

    private void createStorageDirIfNeeded() {
        try {
            Files.createDirectories(storageDir);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to create durable state directory: " + storageDir, ex);
        }
    }
}
