package com.example.demo.controller;

import com.example.demo.dto.MessageDto;
import com.example.demo.model.Message;
import com.example.demo.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/{conversationId}")
    public ResponseEntity<List<Message>> getMessages(@PathVariable Long conversationId) {
        List<Message> messages = messageService.getMessagesForConversation(conversationId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody MessageDto.SendMessageRequest request) {
        Message message = messageService.sendMessage(request);
        return ResponseEntity.ok(message);
    }

    @PostMapping("/{conversationId}/simulate-reply")
    public ResponseEntity<Message> simulatePeerReply(@PathVariable Long conversationId, @RequestParam(required = false) String content) {
        Message message = messageService.simulatePeerReply(conversationId, content);
        return ResponseEntity.ok(message);
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId) {
        messageService.deleteMessageBothSides(messageId);
        return ResponseEntity.noContent().build();
    }
}
