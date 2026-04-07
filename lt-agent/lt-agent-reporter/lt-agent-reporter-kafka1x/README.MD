# kafka 1.x配置说明
``` yml
repoerter:
    name: kafka1x #配置使用kafka-1x-transmitter
    kafka1x: #kafka-1x-transmitter相关参数配置
            kafkaConfig:
                #kafka配置值项，项名称和值请参考kafka文档
                bootstrap.servers: 127.0.0.1:9092
                linger.ms: 200
            topic: #span type和kafka topic映射关系
                default: lt-default #配置默认topic，没有配置映射关系的，数据写到该topic
                proc: lt-process
                para: lt-process-param
                sql: lt-sql
                sqlp: lt-sql-param
                req: lt-request
                log: lt-logger
```