package com.maskan.api.controller;

import com.maskan.api.service.AdminWorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "${app.cors.allowed-origin:https://maskan-app.vercel.app}")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminWorkspaceController {

    private final AdminWorkspaceService adminWorkspaceService;

    @GetMapping("/reports")
    public ResponseEntity<List<Map<String, Object>>> reports() {
        return ResponseEntity.ok(adminWorkspaceService.listReports());
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<Map<String, Object>> reportById(@PathVariable String id) {
        return ResponseEntity.ok(adminWorkspaceService.getReportById(id));
    }

    @PatchMapping("/reports/{id}/status")
    public ResponseEntity<Map<String, Object>> updateReportStatus(@PathVariable String id,
                                                                   @RequestBody Map<String, Object> payload,
                                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(adminWorkspaceService.updateReportStatus(
                id,
                payload == null ? null : (String) payload.get("status"),
                payload == null ? null : (String) payload.get("internalNote"),
                principal.getUsername()
        ));
    }

    @PostMapping("/reports/{id}/actions")
    public ResponseEntity<Map<String, Object>> reportAction(@PathVariable String id,
                                                             @RequestBody Map<String, Object> payload,
                                                             @AuthenticationPrincipal UserDetails principal) {
        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = payload == null ? null : (Map<String, Object>) payload.get("metadata");
        return ResponseEntity.ok(adminWorkspaceService.applyReportAction(
                id,
                payload == null ? null : (String) payload.get("action"),
                payload == null ? null : (String) payload.get("note"),
                principal.getUsername(),
                metadata
        ));
    }

    @GetMapping("/chat/flagged")
    public ResponseEntity<List<Map<String, Object>>> flaggedConversations() {
        return ResponseEntity.ok(adminWorkspaceService.listFlaggedConversations());
    }

    @GetMapping("/chat/flagged/{conversationId}")
    public ResponseEntity<Map<String, Object>> flaggedConversationById(@PathVariable String conversationId) {
        return ResponseEntity.ok(adminWorkspaceService.getFlaggedConversation(conversationId));
    }

    @PostMapping("/chat/moderation-actions")
    public ResponseEntity<Map<String, Object>> createModerationAction(@RequestBody Map<String, Object> payload,
                                                                       @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(adminWorkspaceService.createModerationAction(
                payload == null ? null : (String) payload.get("conversationId"),
                payload == null ? null : (String) payload.get("action"),
                payload == null ? null : (String) payload.get("reason"),
                payload == null ? null : (String) payload.get("severity"),
                principal.getUsername()
        ));
    }

    @GetMapping("/support/tickets")
    public ResponseEntity<List<Map<String, Object>>> supportTickets() {
        return ResponseEntity.ok(adminWorkspaceService.listSupportTickets());
    }

    @GetMapping("/support/tickets/{id}")
    public ResponseEntity<Map<String, Object>> supportTicketById(@PathVariable String id) {
        return ResponseEntity.ok(adminWorkspaceService.getSupportTicketById(id));
    }

    @PatchMapping("/support/tickets/{id}")
    public ResponseEntity<Map<String, Object>> patchSupportTicket(@PathVariable String id,
                                                                   @RequestBody Map<String, Object> payload,
                                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(adminWorkspaceService.patchSupportTicket(
                id,
                payload == null ? null : (String) payload.get("action"),
                payload == null ? null : (String) payload.get("assigneeId"),
                payload == null ? null : (String) payload.get("reason"),
                principal.getUsername()
        ));
    }

    @PostMapping("/support/tickets/{id}/messages")
    public ResponseEntity<Map<String, Object>> addSupportTicketMessage(@PathVariable String id,
                                                                        @RequestBody Map<String, Object> payload,
                                                                        @AuthenticationPrincipal UserDetails principal) {
        boolean internal = payload != null && Boolean.TRUE.equals(payload.get("internal"));
        return ResponseEntity.ok(adminWorkspaceService.addSupportTicketMessage(
                id,
                payload == null ? null : (String) payload.get("senderId"),
                payload == null ? null : (String) payload.get("content"),
                internal,
                principal.getUsername()
        ));
    }

    @GetMapping("/finance/summary")
    public ResponseEntity<Map<String, Object>> financeSummary() {
        return ResponseEntity.ok(adminWorkspaceService.getFinanceSummary());
    }

    @GetMapping("/finance/payouts")
    public ResponseEntity<List<Map<String, Object>>> financePayouts() {
        return ResponseEntity.ok(adminWorkspaceService.listFinancePayouts());
    }

    @GetMapping("/finance/refunds")
    public ResponseEntity<List<Map<String, Object>>> financeRefunds() {
        return ResponseEntity.ok(adminWorkspaceService.listFinanceRefunds());
    }

    @GetMapping("/finance/payments/history")
    public ResponseEntity<List<Map<String, Object>>> paymentsHistory() {
        return ResponseEntity.ok(adminWorkspaceService.listPaymentHistory());
    }

    @GetMapping("/finance/invoices/{invoiceId}/download")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable String invoiceId) {
        byte[] bytes = adminWorkspaceService.buildInvoiceBytes(invoiceId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDisposition(ContentDisposition.attachment().filename("invoice-" + invoiceId + ".txt", StandardCharsets.UTF_8).build());

        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @GetMapping("/finance/export")
    public ResponseEntity<byte[]> exportFinance(@RequestParam(defaultValue = "csv") String format) {
        byte[] bytes = adminWorkspaceService.exportFinance(format);

        HttpHeaders headers = new HttpHeaders();
        MediaType mediaType = "pdf".equalsIgnoreCase(format) ? MediaType.APPLICATION_PDF : MediaType.TEXT_PLAIN;
        String extension = "pdf".equalsIgnoreCase(format) ? "pdf" : "csv";

        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.attachment().filename("finance-export." + extension, StandardCharsets.UTF_8).build());

        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    @GetMapping("/analytics/revenue-trend")
    public ResponseEntity<List<Map<String, Object>>> revenueTrend(@RequestParam(required = false) String from,
                                                                  @RequestParam(required = false) String to,
                                                                  @RequestParam(defaultValue = "month") String groupBy) {
        return ResponseEntity.ok(adminWorkspaceService.revenueTrend(from, to, groupBy));
    }

    @GetMapping("/analytics/booking-trend")
    public ResponseEntity<List<Map<String, Object>>> bookingTrend(@RequestParam(required = false) String from,
                                                                  @RequestParam(required = false) String to,
                                                                  @RequestParam(defaultValue = "month") String groupBy) {
        return ResponseEntity.ok(adminWorkspaceService.bookingTrend(from, to, groupBy));
    }

    @GetMapping("/analytics/user-growth")
    public ResponseEntity<List<Map<String, Object>>> userGrowth(@RequestParam(required = false) String from,
                                                                @RequestParam(required = false) String to,
                                                                @RequestParam(defaultValue = "month") String groupBy) {
        return ResponseEntity.ok(adminWorkspaceService.userGrowth(from, to, groupBy));
    }

    @GetMapping("/analytics/top-cities")
    public ResponseEntity<List<Map<String, Object>>> topCities(@RequestParam(required = false) String from,
                                                                @RequestParam(required = false) String to,
                                                                @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminWorkspaceService.topCities(from, to, limit));
    }

    @GetMapping("/analytics/conversion-rate")
    public ResponseEntity<Map<String, Object>> conversionRate(@RequestParam(required = false) String from,
                                                               @RequestParam(required = false) String to) {
        return ResponseEntity.ok(adminWorkspaceService.conversionRate(from, to));
    }

    @GetMapping("/analytics/most-active-hosts")
    public ResponseEntity<List<Map<String, Object>>> mostActiveHosts(@RequestParam(required = false) String from,
                                                                      @RequestParam(required = false) String to,
                                                                      @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminWorkspaceService.mostActiveHosts(from, to, limit));
    }

    @GetMapping("/analytics/complaint-categories")
    public ResponseEntity<List<Map<String, Object>>> complaintCategories(@RequestParam(required = false) String from,
                                                                          @RequestParam(required = false) String to) {
        return ResponseEntity.ok(adminWorkspaceService.complaintCategories(from, to));
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, Object>> getSettings() {
        return ResponseEntity.ok(adminWorkspaceService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<Map<String, Object>> updateSettings(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(adminWorkspaceService.updateSettings(payload == null ? Map.of() : payload));
    }

    @GetMapping("/content")
    public ResponseEntity<Map<String, Object>> getContent() {
        return ResponseEntity.ok(adminWorkspaceService.getContent());
    }

    @PutMapping("/content")
    public ResponseEntity<Map<String, Object>> updateContent(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(adminWorkspaceService.updateContent(payload == null ? Map.of() : payload));
    }

    @GetMapping("/notifications/templates")
    public ResponseEntity<List<Map<String, Object>>> notificationTemplates() {
        return ResponseEntity.ok(adminWorkspaceService.listNotificationTemplates());
    }

    @PostMapping("/notifications/send")
    public ResponseEntity<Map<String, Object>> sendNotification(@RequestBody Map<String, Object> payload,
                                                                 @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(adminWorkspaceService.sendNotification(payload == null ? Map.of() : payload, principal.getUsername()));
    }

    @PostMapping("/notifications/schedule")
    public ResponseEntity<Map<String, Object>> scheduleNotification(@RequestBody Map<String, Object> payload,
                                                                     @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(adminWorkspaceService.scheduleNotification(payload == null ? Map.of() : payload, principal.getUsername()));
    }

    @GetMapping("/notifications/history")
    public ResponseEntity<List<Map<String, Object>>> notificationHistory() {
        return ResponseEntity.ok(adminWorkspaceService.notificationHistory());
    }
}
