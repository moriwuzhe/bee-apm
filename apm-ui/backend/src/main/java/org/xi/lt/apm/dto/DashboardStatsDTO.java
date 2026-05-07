package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class DashboardStatsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long totalApps;
    private Long onlineApps;
    private Long warningApps;
    private Long errorApps;
    private Long totalAgents;
    private Long onlineAgents;
    private Long serverNodes;
    private Long totalRequests;
    private Double errorRate;
    private Double avgResponseTime;
    private Long activeAlerts;
    private Long alertsToday;
    private Double healthScore;

    public DashboardStatsDTO() {}

    public DashboardStatsDTO(Long totalApps, Long onlineApps, Long warningApps, Long errorApps,
                            Long totalRequests, Long successCount, Double avgResponseTime, Long alertsToday) {
        this.totalApps = totalApps;
        this.onlineApps = onlineApps;
        this.warningApps = warningApps;
        this.errorApps = errorApps;
        this.totalAgents = totalApps;
        this.onlineAgents = onlineApps;
        this.serverNodes = totalApps;
        this.totalRequests = totalRequests;
        this.errorRate = totalRequests > 0 ? 100.0 * (totalRequests - successCount) / totalRequests : 0.0;
        this.avgResponseTime = avgResponseTime;
        this.activeAlerts = alertsToday;
        this.alertsToday = alertsToday;
        this.healthScore = 90.0 - this.errorRate;
    }
}
