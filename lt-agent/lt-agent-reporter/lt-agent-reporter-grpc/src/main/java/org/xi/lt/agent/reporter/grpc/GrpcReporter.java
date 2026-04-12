package org.xi.lt.agent.reporter.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import io.grpc.stub.StreamObserver;
import org.xi.lt.common.annotation.LtPlugin;
import org.xi.lt.common.annotation.LtPluginType;
import org.xi.lt.agent.log.ILog;
import org.xi.lt.agent.log.LogFactory;
import org.xi.lt.agent.model.Span;
import org.xi.lt.agent.reporter.AbstractReporter;
import org.xi.lt.common.grpc.LtApmReportServiceGrpc;
import org.xi.lt.common.grpc.ReportReply;
import org.xi.lt.common.grpc.SpanBatchRequest;
import org.xi.lt.common.grpc.SpanRequest;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * @author yuan
 */
@LtPlugin(type = LtPluginType.REPORTER, name = "grpc")
public class GrpcReporter extends AbstractReporter {

    private static final ILog log = LogFactory.getLog(GrpcReporter.class.getSimpleName());

    private ManagedChannel channel;
    private LtApmReportServiceGrpc.LtApmReportServiceStub asyncStub;

    @Override
    public int init() {
        String serverUrl = System.getProperty("lt.agent.report.url");
        if (serverUrl == null || serverUrl.isEmpty()) {
            serverUrl = "127.0.0.1:9090";
        }
        
        String[] hostPort = serverUrl.split(":");
        String host = hostPort[0];
        int port = 9090;
        if (hostPort.length > 1) {
            port = Integer.parseInt(hostPort[1]);
        }

        channel = ManagedChannelBuilder.forAddress(host, port)
                .usePlaintext() // for dev only
                .keepAliveTime(30, TimeUnit.SECONDS)
                .build();
                
        asyncStub = LtApmReportServiceGrpc.newStub(channel);
        log.info("GrpcReporter initialized. Connected to " + host + ":" + port);
        return 1;
    }

    @Override
    public int report(Span span) {
        if (span == null) {
            return 0;
        }
        return report(java.util.Collections.singletonList(span));
    }

    @Override
    public int report(List<Span> list) {
        if (list == null || list.isEmpty() || asyncStub == null) {
            return 0;
        }

        SpanBatchRequest.Builder batchBuilder = SpanBatchRequest.newBuilder();

        for (Span span : list) {
            SpanRequest.Builder reqBuilder = SpanRequest.newBuilder()
                    .setId(span.getId() == null ? "" : span.getId())
                    .setPid(span.getPid() == null ? "" : span.getPid())
                    .setGid(span.getGid() == null ? "" : span.getGid())
                    .setType(span.getType() == null ? "" : span.getType())
                    .setSrcApp(span.getTag("srcApp") == null ? "" : String.valueOf(span.getTag("srcApp")))
                    .setCTag(span.getTag("cTag") == null ? "" : String.valueOf(span.getTag("cTag")))
                    .setTime(span.getTime() == null ? "" : String.valueOf(span.getTime().getTime()))
                    .setApp(span.getApp() == null ? "" : span.getApp())
                    .setEnv(span.getEnv() == null ? "" : span.getEnv())
                    .setIp(span.getIp() == null ? "" : span.getIp())
                    .setSpend(span.getSpend() == null ? 0 : span.getSpend().intValue());

            if (span.getTags() != null) {
                for (Map.Entry<String, Object> entry : span.getTags().entrySet()) {
                    if (entry.getValue() != null) {
                        reqBuilder.putTags(entry.getKey(), entry.getValue().toString());
                    }
                }
            }

            batchBuilder.addSpans(reqBuilder.build());
        }

        try {
            asyncStub.reportSpanBatch(batchBuilder.build(), new StreamObserver<ReportReply>() {
                @Override
                public void onNext(ReportReply reply) {
                    // Ignore response to save resources
                }

                @Override
                public void onError(Throwable t) {
                    log.error("GrpcReporter async report failed", t);
                }

                @Override
                public void onCompleted() {
                    // Done
                }
            });
        } catch (Exception e) {
            log.error("GrpcReporter report error", e);
        }

        return list.size();
    }
}
