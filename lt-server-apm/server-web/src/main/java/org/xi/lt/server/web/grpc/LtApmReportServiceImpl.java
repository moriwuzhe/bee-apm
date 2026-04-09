package org.xi.lt.server.web.grpc;

import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.RestHighLevelClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.xi.lt.common.grpc.LtApmReportServiceGrpc;
import org.xi.lt.common.grpc.ReportReply;
import org.xi.lt.common.grpc.SpanBatchRequest;
import org.xi.lt.common.grpc.SpanRequest;

import java.util.HashMap;
import java.util.Map;

@GrpcService
public class LtApmReportServiceImpl extends LtApmReportServiceGrpc.LtApmReportServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(LtApmReportServiceImpl.class);

    @Autowired
    private RestHighLevelClient restHighLevelClient;

    @Override
    public void reportSpanBatch(SpanBatchRequest request, StreamObserver<ReportReply> responseObserver) {
        try {
            if (request.getSpansCount() > 0) {
                BulkRequest bulkRequest = new BulkRequest();
                for (SpanRequest span : request.getSpansList()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", span.getId());
                    map.put("pid", span.getPid());
                    map.put("gid", span.getGid());
                    map.put("type", span.getType());
                    map.put("srcApp", span.getSrcApp());
                    map.put("cTag", span.getCTag());
                    map.put("time", span.getTime());
                    map.put("app", span.getApp());
                    map.put("env", span.getEnv());
                    map.put("ip", span.getIp());
                    map.put("spend", span.getSpend());
                    if (span.getTagsMap() != null && !span.getTagsMap().isEmpty()) {
                        map.put("tags", span.getTagsMap());
                    }
                    
                    IndexRequest indexRequest = new IndexRequest("lt_apm_span", "span");
                    indexRequest.source(map);
                    bulkRequest.add(indexRequest);
                }
                
                restHighLevelClient.bulk(bulkRequest);
            }
            
            ReportReply reply = ReportReply.newBuilder().setSuccess(true).setMessage("OK").build();
            responseObserver.onNext(reply);
            responseObserver.onCompleted();
            
        } catch (Exception e) {
            log.error("Error processing gRPC SpanBatchRequest", e);
            ReportReply reply = ReportReply.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
            responseObserver.onNext(reply);
            responseObserver.onCompleted();
        }
    }

    @Override
    public void reportSpan(SpanRequest request, StreamObserver<ReportReply> responseObserver) {
        ReportReply reply = ReportReply.newBuilder().setSuccess(true).setMessage("OK").build();
        responseObserver.onNext(reply);
        responseObserver.onCompleted();
    }
}
