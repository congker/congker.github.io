# Flink 教程

## 1. Flink 是什么

Apache Flink 是一个分布式流处理计算引擎，主要用于处理实时数据流，也可以处理批数据。它的核心思想是：批处理是有界流处理，流处理是无界数据处理。

Flink 常用于以下场景：

- 实时日志分析
- 实时风控
- 实时数仓
- 用户行为分析
- IoT 数据处理
- 实时 ETL
- 实时监控告警

## 2. Flink 的核心特点

### 2.1 流批一体

Flink 使用统一的执行模型处理有界数据和无界数据。对于开发者来说，可以用类似的 API 处理批任务和流任务。

### 2.2 低延迟和高吞吐

Flink 支持毫秒级延迟，同时能保持较高吞吐能力，适合对实时性要求较高的业务。

### 2.3 状态计算

Flink 支持有状态计算，可以在任务中保存中间状态。例如统计用户最近 10 分钟的访问次数，就需要保存每个用户的计数状态。

### 2.4 容错机制

Flink 通过 Checkpoint 机制保证任务失败后可以从一致状态恢复，避免数据重复计算或丢失。

### 2.5 事件时间

Flink 支持按事件真实发生时间处理数据，而不是只按系统接收到数据的时间处理。这对乱序数据非常重要。

## 3. Flink 架构

Flink 集群主要由以下组件组成：

- JobManager：负责作业调度、资源协调、Checkpoint 协调。
- TaskManager：负责实际执行计算任务。
- Client：负责提交 Flink 作业。

作业提交后，Flink 会将程序转换为执行图，然后分配到多个 TaskManager 上并行运行。

## 4. 安装 Flink

### 4.1 前置条件

需要先安装 Java。常见生产环境通常使用 Java 8、Java 11 或与当前 Flink 版本兼容的 Java 版本。

检查 Java：

```bash
java -version
```

### 4.2 下载并解压

```bash
wget https://archive.apache.org/dist/flink/flink-1.19.0/flink-1.19.0-bin-scala_2.12.tgz
tar -zxvf flink-1.19.0-bin-scala_2.12.tgz
cd flink-1.19.0
```

### 4.3 启动本地集群

```bash
./bin/start-cluster.sh
```

启动后可以访问 Flink Web UI：

```text
http://localhost:8081
```

停止集群：

```bash
./bin/stop-cluster.sh
```

## 5. Flink DataStream 入门

下面是一个简单的 WordCount 流处理示例。

### 5.1 Java 示例

```java
import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;

public class WordCount {
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        DataStream<String> lines = env.socketTextStream("localhost", 9999);

        DataStream<WordWithCount> result = lines
                .flatMap(new Splitter())
                .keyBy(value -> value.word)
                .sum("count");

        result.print();

        env.execute("Flink WordCount");
    }

    public static class Splitter implements FlatMapFunction<String, WordWithCount> {
        @Override
        public void flatMap(String line, Collector<WordWithCount> out) {
            for (String word : line.split("\\s+")) {
                if (!word.isEmpty()) {
                    out.collect(new WordWithCount(word, 1));
                }
            }
        }
    }

    public static class WordWithCount {
        public String word;
        public long count;

        public WordWithCount() {}

        public WordWithCount(String word, long count) {
            this.word = word;
            this.count = count;
        }

        @Override
        public String toString() {
            return word + ": " + count;
        }
    }
}
```

### 5.2 启动测试端口

```bash
nc -lk 9999
```

在终端输入：

```text
hello flink
hello bigdata
```

程序会持续输出每个单词出现的次数。

## 6. 常用算子

### 6.1 map

一进一出，用于转换数据。

```java
stream.map(value -> value.toUpperCase());
```

### 6.2 flatMap

一进多出，常用于拆分数据。

```java
stream.flatMap((String line, Collector<String> out) -> {
    for (String word : line.split(" ")) {
        out.collect(word);
    }
});
```

### 6.3 filter

过滤不符合条件的数据。

```java
stream.filter(value -> value.startsWith("ERROR"));
```

### 6.4 keyBy

按 Key 分组，后续可以做聚合或状态计算。

```java
stream.keyBy(value -> value.userId);
```

### 6.5 window

按时间或数量划分窗口。

```java
stream
    .keyBy(value -> value.userId)
    .window(TumblingEventTimeWindows.of(Time.minutes(5)));
```

## 7. 时间语义

Flink 中常见的时间语义有三种：

- Processing Time：处理时间，以机器系统时间为准。
- Event Time：事件时间，以数据本身携带的时间为准。
- Ingestion Time：摄入时间，以进入 Flink 的时间为准。

生产环境中，实时分析通常优先考虑 Event Time，因为它能更准确反映业务事件发生的时间。

## 8. Watermark

Watermark 用于处理乱序数据。它表示系统认为某个时间点之前的数据大概率已经到齐。

例如设置最大乱序时间为 5 秒：

```java
WatermarkStrategy
    .<Event>forBoundedOutOfOrderness(Duration.ofSeconds(5))
    .withTimestampAssigner((event, timestamp) -> event.getEventTime());
```

如果数据延迟超过 Watermark 允许范围，就可能被视为迟到数据。可以使用侧输出流收集迟到数据。

## 9. 窗口类型

### 9.1 滚动窗口

窗口之间没有重叠。例如每 5 分钟统计一次订单金额。

```java
TumblingEventTimeWindows.of(Time.minutes(5))
```

### 9.2 滑动窗口

窗口之间有重叠。例如每 1 分钟输出过去 5 分钟的统计结果。

```java
SlidingEventTimeWindows.of(Time.minutes(5), Time.minutes(1))
```

### 9.3 会话窗口

根据用户行为间隔划分窗口。例如用户 30 分钟内没有新行为，则认为一个会话结束。

```java
EventTimeSessionWindows.withGap(Time.minutes(30))
```

## 10. 状态管理

Flink 状态主要分为：

- Keyed State：和 Key 绑定的状态。
- Operator State：和算子实例绑定的状态。

常用 Keyed State：

- ValueState
- ListState
- MapState
- ReducingState
- AggregatingState

示例：

```java
private transient ValueState<Long> countState;

@Override
public void open(Configuration parameters) {
    ValueStateDescriptor<Long> descriptor =
            new ValueStateDescriptor<>("count", Long.class);
    countState = getRuntimeContext().getState(descriptor);
}
```

## 11. Checkpoint

Checkpoint 是 Flink 容错的核心。开启 Checkpoint 后，Flink 会定期保存作业状态。当任务失败时，可以从最近一次成功的 Checkpoint 恢复。

```java
env.enableCheckpointing(60000);
```

常见配置：

```java
env.getCheckpointConfig().setCheckpointTimeout(10 * 60 * 1000);
env.getCheckpointConfig().setMinPauseBetweenCheckpoints(30000);
env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
```

生产环境建议将 Checkpoint 存储到 HDFS、S3 或其他可靠存储中。

## 12. Flink SQL

Flink SQL 适合实时数仓和实时 ETL 场景。

示例：

```sql
CREATE TABLE orders (
    order_id STRING,
    user_id STRING,
    amount DECIMAL(10, 2),
    order_time TIMESTAMP(3),
    WATERMARK FOR order_time AS order_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'orders',
    'properties.bootstrap.servers' = 'localhost:9092',
    'format' = 'json'
);

SELECT user_id, SUM(amount)
FROM orders
GROUP BY user_id;
```

## 13. 提交作业

将程序打包成 Jar 后，可以提交到 Flink 集群：

```bash
./bin/flink run -c com.example.WordCount target/flink-demo.jar
```

查看运行中的任务：

```bash
./bin/flink list
```

取消任务：

```bash
./bin/flink cancel <job-id>
```

## 14. 与 Kafka 集成

Flink 经常与 Kafka 搭配使用。Kafka 负责消息存储和缓冲，Flink 负责实时计算。

典型链路：

```text
业务系统 -> Kafka -> Flink -> Kafka/HBase/ClickHouse/Elasticsearch
```

Flink 读取 Kafka 数据后，可以清洗、聚合、关联维表，再写入下游系统。

## 15. 生产实践建议

- 为每个作业开启 Checkpoint。
- 合理设置并行度，避免过度并行导致资源浪费。
- 使用 RocksDB StateBackend 处理大状态任务。
- 监控反压、Checkpoint 时间、失败次数和延迟。
- 对 Kafka Source 设置合理的消费组和 Offset 策略。
- 对外部 Sink 做幂等或事务设计，降低失败恢复后的重复写入风险。
- 对迟到数据设计补偿链路。

## 16. 常见问题

### 16.1 Flink 和 Spark Streaming 有什么区别

Flink 是原生流处理引擎，Spark Streaming 早期主要基于微批处理。Flink 在低延迟、有状态流处理、事件时间处理方面更有优势。

### 16.2 为什么 Checkpoint 很慢

常见原因包括状态过大、存储系统性能不足、反压严重、网络带宽不足、Checkpoint 间隔过短。

### 16.3 如何处理数据重复

可以通过幂等 Sink、事务 Sink、主键覆盖写入或业务去重状态解决。

## 17. 总结

Flink 的核心能力是实时、有状态、低延迟的流处理。学习 Flink 时，建议按以下顺序掌握：

1. DataStream 基础 API
2. 时间语义和 Watermark
3. 窗口计算
4. 状态管理
5. Checkpoint 和容错
6. Flink SQL
7. Kafka、HBase、Hive 等生态集成

掌握这些内容后，就可以构建较完整的实时数据处理链路。
