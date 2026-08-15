package com.example.demo.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

public class ConversationDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateConversationRequest {
        private String userPhoneNumber;
        private String peerPhoneNumber;
        private String initialMessage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SavePermanentRequest {
        private String alias;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeWarpRequest {
        private String userPhoneNumber;
        private int daysToAdvance;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StatsResponse {
        private long totalConversations;
        private long activeTemporary;
        private long permanentSaved;
        private long expiringSoon; // <= 5 days left
        private long deletedByPeer;
    }
}
