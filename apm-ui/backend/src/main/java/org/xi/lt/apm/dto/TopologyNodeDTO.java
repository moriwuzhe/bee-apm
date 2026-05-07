package org.xi.lt.apm.dto;

public class TopologyNodeDTO {
    private String id;
    private String label;
    private int x;
    private int y;
    private String type;
    private String status;

    public TopologyNodeDTO() {}

    public TopologyNodeDTO(String id, String label, int x, int y, String type, String status) {
        this.id = id;
        this.label = label;
        this.x = x;
        this.y = y;
        this.type = type;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public int getX() { return x; }
    public void setX(int x) { this.x = x; }
    public int getY() { return y; }
    public void setY(int y) { this.y = y; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}