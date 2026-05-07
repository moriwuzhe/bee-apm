package org.xi.lt.apm.dto;

public class LogEntryDTO {
    private String id;
    private String timestamp;
    private String level;
    private String service;
    private String thread;
    private String message;
    private String stackTrace;

    public LogEntryDTO() {}

    public LogEntryDTO(String id, String timestamp, String level, String service, String thread, String message, String stackTrace) {
        this.id = id;
        this.timestamp = timestamp;
        this.level = level;
        this.service = service;
        this.thread = thread;
        this.message = message;
        this.stackTrace = stackTrace;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public String getService() { return service; }
    public void setService(String service) { this.service = service; }
    public String getThread() { return thread; }
    public void setThread(String thread) { this.thread = thread; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStackTrace() { return stackTrace; }
    public void setStackTrace(String stackTrace) { this.stackTrace = stackTrace; }
}