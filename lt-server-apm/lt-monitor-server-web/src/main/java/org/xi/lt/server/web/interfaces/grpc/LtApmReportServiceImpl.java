package org.xi.lt.server.web.interfaces.grpc;

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
import org.xi.lt.server.web.service.TailBasedSamplingService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@GrpcService
public class LtApmReportServiceImpl extends LtApmReportServiceGrpc.LtApmReportServiceImplBase {

    private static final Logger log = LoggerFactory.getLogger(LtApmReportServiceImpl.class);

    @Autowired
    private TailBasedSamplingService samplingService;

    @Override
    public void reportSpanBatch(SpanBatchRequest request, StreamObserver<ReportReply> responseObserver) {
        try {
            if (request.getSpansCount() > 0) {
                // 根据GID分组进行尾部采样投递
                Map groupedSpans = new HashMap();
                
                for (SpanRequest span : request.getSpansList()) {
                    Map map = new HashMap();
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
                    
                    String gid = span.getGid();
                    List list = (List) groupedSpans.get(gid);
                    if (list == null) {
                        list = new ArrayList();
                        groupedSpans.put(gid, list);
                    }
                    list.add(map);
                }
                
                // 将数据投递给采样服务
                for (Object e : groupedSpans.entrySet()) {
                    Map.Entry entry = (Map.Entry) e;
                    samplingService.addSpans(String.valueOf(entry.getKey()), (List<?>) entry.getValue());
                }
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
        try {
            Map map = new HashMap();
            map.put("id", request.getId());
            map.put("pid", request.getPid());
            map.put("gid", request.getGid());
            map.put("type", request.getType());
            map.put("srcApp", request.getSrcApp());
            map.put("cTag", request.getCTag());
            map.put("time", request.getTime());
            map.put("app", request.getApp());
            map.put("env", request.getEnv());
            map.put("ip", request.getIp());
            map.put("spend", request.getSpend());
            if (request.getTagsMap() != null && !request.getTagsMap().isEmpty()) {
                map.put("tags", request.getTagsMap());
            }
            
            List spanList = new ArrayList();
            spanList.add(map);
            samplingService.addSpans(request.getGid(), spanList);
            
            ReportReply reply = ReportReply.newBuilder().setSuccess(true).setMessage("OK").build();
            responseObserver.onNext(reply);
            responseObserver.onCompleted();
        } catch (Exception e) {
            log.error("Error processing single gRPC SpanRequest", e);
            ReportReply reply = ReportReply.newBuilder().setSuccess(false).setMessage(e.getMessage()).build();
            responseObserver.onNext(reply);
            responseObserver.onCompleted();
        }
    }
}
