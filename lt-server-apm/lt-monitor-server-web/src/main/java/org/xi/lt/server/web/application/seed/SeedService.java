package org.xi.lt.server.web.application.seed;

import org.elasticsearch.action.bulk.BulkRequest;
import org.elasticsearch.action.bulk.BulkResponse;
import org.elasticsearch.action.index.IndexRequest;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.common.xcontent.XContentType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.xi.lt.server.domain.model.seed.SeedResult;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class SeedService {
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    @Autowired(required = false)
    private RestHighLevelClient restHighLevelClient;

    public SeedResult seedAll(int hours, int apps, int instPerApp, int reqPerApp) throws Exception {
        int h = hours <= 0 ? 2 : Math.min(72, hours);
        int a = apps <= 0 ? 2 : Math.min(10, apps);
        int i = instPerApp <= 0 ? 2 : Math.min(10, instPerApp);
        int r = reqPerApp <= 0 ? 80 : Math.min(2000, reqPerApp);

        long end = System.currentTimeMillis();
        long start = end - h * 60L * 60L * 1000L;

        BulkRequest bulk = new BulkRequest();

        String[] envs = new String[]{"preprod", "prod"};

        for (int ai = 0; ai < a; ai += 1) {
            String app = ai == 0 ? "lt-preprod-demo" : ("demo-app-" + (ai + 1));
            String env = envs[ai % envs.length];
            for (int ii = 0; ii < i; ii += 1) {
                String inst = "inst" + (ii + 1);
                String ip = "127.0.0." + (10 + ai * 5 + ii);
                String port = String.valueOf(8100 + ai * 10 + ii);
                seedHeartbeat(bulk, start, end, env, app, inst, ip, port);
                seedRequests(bulk, r / i, start, end, env, app, inst, ip, port);
            }
        }

        BulkResponse resp = restHighLevelClient.bulk(bulk);
        SeedResult out = new SeedResult();
        out.setTookMs(resp.getTook() == null ? 0 : resp.getTook().getMillis());
        out.setHasFailures(resp.hasFailures());
        out.setHours(h);
        out.setApps(a);
        out.setInstPerApp(i);
        out.setReqPerApp(r);
        return out;
    }

    private void seedHeartbeat(BulkRequest bulk, long start, long end, String env, String app, String inst, String ip, String port) {
        long step = 5L * 60L * 1000L;
        for (long t = start; t <= end; t += step) {
            String day = dayOf(t);
            Map doc = (Map) base(env, app, inst, ip, port, t);
            doc.put("type", "hb");
            doc.put("id", "hb_" + app + "_" + inst + "_" + t);
            Map tags = new HashMap();
            tags.put("version", "1.0." + (Math.abs(app.hashCode()) % 10));
            doc.put("tags", tags);
            add(bulk, "lt-heartbeat-" + day, doc.get("id").toString(), doc);
        }
    }

    private void seedRequests(BulkRequest bulk, int count, long start, long end, String env, String app, String inst, String ip, String port) {
        long range = Math.max(1, end - start);
        String[] urls = new String[]{"/hello/sayHello", "/order/create", "/order/pay", "/user/login", "/user/profile", "/report/export"};
        String[] remotes = new String[]{"10.0.0.1", "10.0.0.2", "172.16.1.9", "192.168.1.10"};

        for (int k = 0; k < count; k += 1) {
            long t = start + (Math.abs((long) (app.hashCode() * 31L + inst.hashCode() * 13L + k)) % range);
            String day = dayOf(t);

            String gid = "G" + uuid32();
            String rid = "R" + uuid32();

            int spend = 5 + (k % 60) * (k % 3 == 0 ? 2 : 1);
            String url = urls[k % urls.length];
            String method = (k % 7 == 0) ? "GET" : "POST";
            String remote = remotes[k % remotes.length];

            Map req = (Map) base(env, app, inst, ip, port, t);
            req.put("type", "req");
            req.put("gid", gid);
            req.put("pid", "");
            req.put("id", rid);
            req.put("spend", (long) spend);
            Map tags = new HashMap();
            tags.put("url", url);
            tags.put("method", method);
            tags.put("remote", remote);
            tags.put("srcApp", "gateway");
            tags.put("srcInst", "gw1");
            req.put("tags", tags);
            add(bulk, "lt-request-" + day, rid, req);

            Map reqb = (Map) base(env, app, inst, ip, port, t);
            reqb.put("type", "reqb");
            reqb.put("gid", gid);
            reqb.put("id", rid);
            Map reqbTags = new HashMap();
            reqbTags.put("body", "{\"k\":\"v\",\"n\":" + k + "}");
            reqb.put("tags", reqbTags);
            add(bulk, "lt-request-body-" + day, rid, reqb);

            Map reqh = (Map) base(env, app, inst, ip, port, t);
            reqh.put("type", "reqh");
            reqh.put("gid", gid);
            reqh.put("id", rid);
            Map reqhTags = new HashMap();
            reqhTags.put("headers", "{\"Content-Type\":\"application/json\"}");
            reqh.put("tags", reqhTags);
            add(bulk, "lt-request-headers-" + day, rid, reqh);

            Map rp = (Map) base(env, app, inst, ip, port, t);
            rp.put("type", "rp");
            rp.put("gid", gid);
            rp.put("id", rid);
            Map rpTags = new HashMap();
            rpTags.put("param", "{}");
            rp.put("tags", rpTags);
            add(bulk, "lt-request-param-" + day, rid, rp);

            Map resb = (Map) base(env, app, inst, ip, port, t + 1);
            resb.put("type", "resb");
            resb.put("gid", gid);
            resb.put("id", rid);
            Map resbTags = new HashMap();
            resbTags.put("body", "{\"code\":0,\"msg\":\"ok\"}");
            resb.put("tags", resbTags);
            add(bulk, "lt-response-body-" + day, rid, resb);

            String pid = "P" + uuid32();
            Map proc = (Map) base(env, app, inst, ip, port, t + 2);
            proc.put("type", "proc");
            proc.put("gid", gid);
            proc.put("pid", rid);
            proc.put("id", pid);
            proc.put("spend", (long) Math.max(1, spend / 3));
            Map procTags = new HashMap();
            procTags.put("method", app + ".Service.method" + (k % 8));
            proc.put("tags", procTags);
            add(bulk, "lt-process-" + day, pid, proc);

            String sid = "S" + uuid32();
            Map sql = (Map) base(env, app, inst, ip, port, t + 3);
            sql.put("type", "sql");
            sql.put("gid", gid);
            sql.put("pid", pid);
            sql.put("id", sid);
            sql.put("spend", (long) Math.max(1, spend / 4));
            Map sqlTags = new HashMap();
            sqlTags.put("sql", "select * from t_demo where id=" + (k % 50));
            sqlTags.put("count", String.valueOf((k % 5) + 1));
            sql.put("tags", sqlTags);
            add(bulk, "lt-sql-" + day, sid, sql);

            String txid = "T" + uuid32();
            Map tx = (Map) base(env, app, inst, ip, port, t + 4);
            tx.put("type", "tx");
            tx.put("gid", gid);
            tx.put("pid", pid);
            tx.put("id", txid);
            tx.put("spend", (long) Math.max(1, spend / 2));
            Map txTags = new HashMap();
            txTags.put("count", String.valueOf((k % 3) + 1));
            txTags.put("point", app + ".TxService.txPoint" + (k % 6));
            tx.put("tags", txTags);
            add(bulk, "lt-tx-" + day, txid, tx);

            String lid = "L" + uuid32();
            Map log = (Map) base(env, app, inst, ip, port, t + 5);
            log.put("type", "log");
            log.put("gid", gid);
            log.put("pid", rid);
            log.put("id", lid);
            Map logTags = new HashMap();
            String[] levels = new String[]{"info", "debug", "error"};
            logTags.put("level", levels[k % levels.length]);
            logTags.put("point", app + ".LogPoint");
            logTags.put("log", "demo log " + k + " url=" + url);
            log.put("tags", logTags);
            add(bulk, "lt-logger-" + day, lid, log);

            if (k % 12 == 0) {
                String eid = "E" + uuid32();
                Map err = (Map) base(env, app, inst, ip, port, t + 6);
                err.put("type", "err");
                err.put("gid", gid);
                err.put("pid", rid);
                err.put("id", eid);
                Map errTags = new HashMap();
                errTags.put("level", "error");
                errTags.put("point", app + ".ErrorPoint");
                errTags.put("log", "java.lang.RuntimeException: demo error " + k);
                err.put("tags", errTags);
                add(bulk, "lt-error-" + day, eid, err);
            }
        }
    }

    private Object base(String env, String app, String inst, String ip, String port, long t) {
        Map doc = new HashMap();
        doc.put("env", env);
        doc.put("app", app);
        doc.put("inst", inst);
        doc.put("ip", ip);
        doc.put("port", port);
        doc.put("time", ISO.format(Instant.ofEpochMilli(t)));
        return doc;
    }

    private void add(BulkRequest bulk, String index, String id, Object doc) {
        String json = com.alibaba.fastjson.JSON.toJSONString(doc);
        bulk.add(new IndexRequest(index, "span", id).source(json, XContentType.JSON));
    }

    private String dayOf(long epochMs) {
        ZonedDateTime zdt = Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault());
        return DAY.format(zdt);
    }

    private String uuid32() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}

