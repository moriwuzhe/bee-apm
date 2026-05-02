package org.xi.lt.apm.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class DashboardStatsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long totalApps;
    private Long onlineAgents;
    private Long totalAgents;
    private Long serverNodes;
    private Long activeAlerts;
    private Double healthScore;
    private Long avgResponseTime;

    public DashboardStatsDTO() {}

    public DashboardStatsDTO(Long totalApps, Long onlineAgents, Long totalAgents,
                            Long serverNodes, Long activeAlerts, Double healthScore, Long avgResponseTime) {
        this.totalApps = totalApps;
        this.onlineAgents = onlineAgents;
        this.totalAgents = totalAgents;
        this.serverNodes = serverNodes;
        this.activeAlerts = activeAlerts;
        this.healthScore = healthScore;
        this.avgResponseTime = avgResponseTime;
    }
}
