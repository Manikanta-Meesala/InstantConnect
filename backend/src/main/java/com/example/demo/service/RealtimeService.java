package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class RealtimeService {

    private final Map<String, Set<SseEmitter>> emittersMap = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userPhone) {
        if (userPhone == null || userPhone.trim().isEmpty()) {
            return null;
        }

        String cleaned = userPhone.replaceAll("\\s+", "");
        SseEmitter emitter = new SseEmitter(1800000L); // 30 minutes timeout

        emittersMap.computeIfAbsent(cleaned, k -> new CopyOnWriteArraySet<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(cleaned, emitter));
        emitter.onTimeout(() -> removeEmitter(cleaned, emitter));
        emitter.onError((e) -> removeEmitter(cleaned, emitter));

        // Send connection acknowledgment event
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"status\":\"connected\",\"phone\":\"" + cleaned + "\"}"));
        } catch (IOException e) {
            removeEmitter(cleaned, emitter);
        }

        return emitter;
    }

    public void notifyUser(String userPhone, String eventName, Object dataJson) {
        if (userPhone == null) return;
        String cleaned = userPhone.replaceAll("\\s+", "");
        Set<SseEmitter> emitters = emittersMap.get(cleaned);

        if (emitters != null && !emitters.isEmpty()) {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name(eventName)
                            .data(dataJson));
                } catch (IOException e) {
                    removeEmitter(cleaned, emitter);
                }
            }
        }
    }

    private void removeEmitter(String userPhone, SseEmitter emitter) {
        Set<SseEmitter> emitters = emittersMap.get(userPhone);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emittersMap.remove(userPhone);
            }
        }
    }
}
