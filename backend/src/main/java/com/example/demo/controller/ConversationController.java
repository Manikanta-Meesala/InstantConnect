package com.example.demo.controller;

import com.example.demo.dto.ConversationDto;
import com.example.demo.model.Conversation;
import com.example.demo.service.ConversationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public ResponseEntity<List<Conversation>> getConversations(@RequestParam String userPhone) {
        List<Conversation> conversations = conversationService.getConversationsForUser(userPhone);
        return ResponseEntity.ok(conversations);
    }

    @PostMapping
    public ResponseEntity<Conversation> createConversation(@RequestBody ConversationDto.CreateConversationRequest request) {
        Conversation conversation = conversationService.createConversation(
                request.getUserPhoneNumber(),
                request.getPeerPhoneNumber(),
                request.getInitialMessage()
        );
        return ResponseEntity.ok(conversation);
    }

    @PutMapping("/{id}/save")
    public ResponseEntity<Conversation> savePermanently(@PathVariable Long id, @RequestBody ConversationDto.SavePermanentRequest request) {
        Conversation conversation = conversationService.savePermanently(id, request.getAlias());
        return ResponseEntity.ok(conversation);
    }

    @PutMapping("/{id}/toggle-peer-deleted")
    public ResponseEntity<Conversation> togglePeerDeleted(@PathVariable Long id) {
        Conversation conversation = conversationService.toggleDeletedByPeer(id);
        return ResponseEntity.ok(conversation);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable Long id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/time-warp")
    public ResponseEntity<Void> timeWarp(@RequestBody ConversationDto.TimeWarpRequest request) {
        conversationService.timeWarp(request.getUserPhoneNumber(), request.getDaysToAdvance());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<ConversationDto.StatsResponse> getStats(@RequestParam String userPhone) {
        ConversationDto.StatsResponse stats = conversationService.getStats(userPhone);
        return ResponseEntity.ok(stats);
    }
}
