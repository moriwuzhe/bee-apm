package org.xi.lt.apm.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.xi.lt.apm.entity.Application;
import org.xi.lt.apm.entity.TraceSpan;
import org.xi.lt.apm.repository.TraceSpanRepository;
import org.xi.lt.apm.service.ApplicationService;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TraceSpanRepository traceSpanRepository;

    @MockBean
    private ApplicationService applicationService;

    private Map<String, Object> spanData;

    @BeforeEach
    void setUp() {
        spanData = new HashMap<>();
        spanData.put("traceId", "trace-123");
        spanData.put("type", "HTTP");
        spanData.put("app", "order-service");
        spanData.put("serviceName", "order-service");
        spanData.put("methodName", "getOrder");
        spanData.put("ip", "192.168.1.10");
        spanData.put("port", 8080);
        spanData.put("spend", 150L);
        spanData.put("success", true);
        spanData.put("inst", "instance-01");
        spanData.put("pid", "12345");
        spanData.put("gid", "group-01");
        spanData.put("env", "production");
    }

    @Test
    void testReportSpan() throws Exception {
        when(traceSpanRepository.save(any(TraceSpan.class))).thenReturn(new TraceSpan());
        when(applicationService.findByAppName(any(String.class))).thenReturn(null);

        mockMvc.perform(post("/apm/report/span")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(spanData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"));
    }

    @Test
    void testReportSpanWithExistingApp() throws Exception {
        Application app = new Application();
        app.setName("order-service");
        app.setStatus("online");
        
        when(traceSpanRepository.save(any(TraceSpan.class))).thenReturn(new TraceSpan());
        when(applicationService.findByAppName("order-service")).thenReturn(app);

        mockMvc.perform(post("/apm/report/span")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(spanData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void testHeartbeat() throws Exception {
        Map<String, Object> heartbeatData = new HashMap<>();
        heartbeatData.put("app", "order-service");
        heartbeatData.put("ip", "192.168.1.10");
        heartbeatData.put("inst", "instance-01");

        mockMvc.perform(post("/apm/report/heartbeat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(heartbeatData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("success"));
    }

    @Test
    void testRegisterNewAgent() throws Exception {
        Map<String, Object> registerData = new HashMap<>();
        registerData.put("app", "new-service");
        registerData.put("env", "production");
        registerData.put("inst", "instance-01");
        registerData.put("ip", "192.168.1.11");
        registerData.put("port", 8081);
        registerData.put("agentVersion", "2.0.1");

        when(applicationService.findByAppName("new-service")).thenReturn(null);
        when(applicationService.save(any(Application.class))).thenReturn(new Application());

        mockMvc.perform(post("/apm/report/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    void testRegisterExistingAgent() throws Exception {
        Application existingApp = new Application();
        existingApp.setName("existing-service");
        existingApp.setStatus("online");

        Map<String, Object> registerData = new HashMap<>();
        registerData.put("app", "existing-service");
        registerData.put("env", "production");

        when(applicationService.findByAppName("existing-service")).thenReturn(existingApp);
        when(applicationService.save(any(Application.class))).thenReturn(existingApp);

        mockMvc.perform(post("/apm/report/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerData)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
