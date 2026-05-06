package com.portal.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import com.portal.backend.payload.response.MessageResponse;

import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<MessageResponse> handleMaxSize(MaxUploadSizeExceededException ex,
            HttpServletRequest req) {
        log.warn("Upload too large at {}: {}", req.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new MessageResponse("File too large: " + ex.getMessage()));
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<MessageResponse> handleMultipart(MultipartException ex,
            HttpServletRequest req) {
        log.error("Multipart parse failed at {}: {}", req.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new MessageResponse("Multipart upload error: " + rootMessage(ex)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleAny(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception at {} {}", req.getMethod(), req.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse(ex.getClass().getSimpleName() + ": " + rootMessage(ex)));
    }

    private static String rootMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        String msg = cur.getMessage();
        return msg != null ? msg : cur.getClass().getSimpleName();
    }
}
