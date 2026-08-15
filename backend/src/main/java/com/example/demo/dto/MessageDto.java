package com.example.demo.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

public class MessageDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendMessageRequest {
        private Long conversationId;
        private String senderPhoneNumber;
        private String recipientPhoneNumber;
        private String content;
    }
}
