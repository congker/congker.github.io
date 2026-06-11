# HBase 教程

## 1. HBase 是什么

Apache HBase 是一个分布式、可扩展、面向列族的 NoSQL 数据库，构建在 HDFS 之上。它适合存储海量稀疏数据，并支持按 RowKey 进行低延迟随机读写。

HBase 常用于以下场景：

- 用户画像
- 实时明细查询
- 风控特征存储
- IoT 时序数据
- 日志明细存储
- 大规模在线查询

## 2. HBase 的特点

### 2.1 海量数据存储

HBase 可以依托 HDFS 存储 TB 到 PB 级数据。

### 2.2 随机读写

和 Hive 更偏向离线分析不同，HBase 支持按 RowKey 快速查询和写入。

### 2.3 列族存储

HBase 的数据按列族组织。列族需要建表时预先定义，列可以动态增加。

### 2.4 强一致读写

对于单行数据，HBase 提供强一致性读写。

### 2.5 稀疏数据友好

HBase 不要求每一行都有相同的列，适合字段很多但每条记录只使用少量字段的场景。

## 3. HBase 数据模型

HBase 表由以下概念组成：

- Table：表。
- RowKey：行键，唯一标识一行。
- Column Family：列族，物理存储单位。
- Column Qualifier：列限定符，列族下的具体列。
- Cell：单元格，由 RowKey、列族、列、时间戳确定。
- Timestamp：版本号，默认使用写入时间。

示例：

```text
表: user_profile
RowKey: user_1001
列族: base
列: name, age, gender
列族: behavior
列: last_login, order_count
```

## 4. HBase 架构

HBase 主要组件：

- HMaster：负责表管理、Region 分配、元数据维护。
- RegionServer：负责实际读写请求。
- Region：表按 RowKey 范围切分后的数据分片。
- ZooKeeper：负责协调服务发现和集群状态。
- HDFS：负责底层数据持久化。

客户端读写数据时，通常先定位 Region 所在的 RegionServer，然后直接与 RegionServer 通信。

## 5. 安装 HBase

### 5.1 前置条件

需要准备：

- Java
- Hadoop
- ZooKeeper

单机学习环境可以使用 HBase 自带的 ZooKeeper，生产环境建议使用独立 ZooKeeper 集群。

### 5.2 下载并解压

```bash
wget https://archive.apache.org/dist/hbase/2.5.8/hbase-2.5.8-bin.tar.gz
tar -zxvf hbase-2.5.8-bin.tar.gz
cd hbase-2.5.8
```

### 5.3 配置环境变量

编辑 `conf/hbase-env.sh`：

```bash
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
```

### 5.4 配置 hbase-site.xml

单机模式示例：

```xml
<configuration>
  <property>
    <name>hbase.rootdir</name>
    <value>file:///data/hbase</value>
  </property>
  <property>
    <name>hbase.zookeeper.property.dataDir</name>
    <value>/data/zookeeper</value>
  </property>
</configuration>
```

伪分布式模式示例：

```xml
<configuration>
  <property>
    <name>hbase.rootdir</name>
    <value>hdfs://localhost:9000/hbase</value>
  </property>
  <property>
    <name>hbase.cluster.distributed</name>
    <value>true</value>
  </property>
  <property>
    <name>hbase.zookeeper.quorum</name>
    <value>localhost</value>
  </property>
</configuration>
```

### 5.5 启动 HBase

```bash
./bin/start-hbase.sh
```

进入 Shell：

```bash
./bin/hbase shell
```

停止 HBase：

```bash
./bin/stop-hbase.sh
```

## 6. HBase Shell 基础

### 6.1 查看状态

```ruby
status
version
whoami
```

### 6.2 创建表

```ruby
create 'user_profile', 'base', 'behavior'
```

### 6.3 查看表

```ruby
list
describe 'user_profile'
```

### 6.4 插入数据

```ruby
put 'user_profile', 'user_1001', 'base:name', 'Tom'
put 'user_profile', 'user_1001', 'base:age', '28'
put 'user_profile', 'user_1001', 'behavior:order_count', '12'
```

### 6.5 查询单行

```ruby
get 'user_profile', 'user_1001'
```

查询指定列：

```ruby
get 'user_profile', 'user_1001', 'base:name'
```

### 6.6 扫描表

```ruby
scan 'user_profile'
```

限制条数：

```ruby
scan 'user_profile', {LIMIT => 10}
```

按 RowKey 范围扫描：

```ruby
scan 'user_profile', {STARTROW => 'user_1000', STOPROW => 'user_2000'}
```

### 6.7 删除数据

删除指定列：

```ruby
delete 'user_profile', 'user_1001', 'base:age'
```

删除整行：

```ruby
deleteall 'user_profile', 'user_1001'
```

### 6.8 删除表

```ruby
disable 'user_profile'
drop 'user_profile'
```

## 7. RowKey 设计

RowKey 是 HBase 性能设计的核心。设计不好会导致热点、扫描慢、查询困难。

### 7.1 RowKey 设计原则

- 查询优先：RowKey 应服务于主要查询场景。
- 避免热点：不要让大量写入集中到同一个 Region。
- 长度适中：过长会增加存储和网络开销。
- 可排序：HBase 按 RowKey 字典序存储，合理利用排序能力。

### 7.2 常见 RowKey 方案

用户维度查询：

```text
user_id
```

用户加时间倒序：

```text
user_id + reverse_timestamp
```

加盐打散热点：

```text
salt + user_id + timestamp
```

哈希前缀：

```text
hash(user_id) % 16 + user_id
```

### 7.3 避免单调递增 RowKey

如果直接使用时间戳作为 RowKey：

```text
20260611120000
20260611120001
20260611120002
```

新数据会持续写入最后一个 Region，造成热点。可以通过加盐、反转时间戳或哈希前缀缓解。

## 8. 列族设计

列族是 HBase 的物理存储单位，同一个列族的数据会存储在一起。

设计建议：

- 列族数量尽量少，通常 1 到 3 个。
- 经常一起查询的列放在同一列族。
- 不同访问频率的数据可以拆到不同列族。
- 大字段和小字段可以分列族存储。

错误示例：

```text
每个字段都建一个列族
```

这种方式会增加存储文件数量和读写复杂度。

## 9. Java API 示例

### 9.1 添加依赖

Maven 示例：

```xml
<dependency>
    <groupId>org.apache.hbase</groupId>
    <artifactId>hbase-client</artifactId>
    <version>2.5.8</version>
</dependency>
```

### 9.2 写入数据

```java
Configuration config = HBaseConfiguration.create();
config.set("hbase.zookeeper.quorum", "localhost");

try (Connection connection = ConnectionFactory.createConnection(config);
     Table table = connection.getTable(TableName.valueOf("user_profile"))) {

    Put put = new Put(Bytes.toBytes("user_1001"));
    put.addColumn(Bytes.toBytes("base"), Bytes.toBytes("name"), Bytes.toBytes("Tom"));
    put.addColumn(Bytes.toBytes("base"), Bytes.toBytes("age"), Bytes.toBytes("28"));

    table.put(put);
}
```

### 9.3 查询数据

```java
Configuration config = HBaseConfiguration.create();
config.set("hbase.zookeeper.quorum", "localhost");

try (Connection connection = ConnectionFactory.createConnection(config);
     Table table = connection.getTable(TableName.valueOf("user_profile"))) {

    Get get = new Get(Bytes.toBytes("user_1001"));
    Result result = table.get(get);

    byte[] value = result.getValue(Bytes.toBytes("base"), Bytes.toBytes("name"));
    System.out.println(Bytes.toString(value));
}
```

### 9.4 扫描数据

```java
Scan scan = new Scan();
scan.withStartRow(Bytes.toBytes("user_1000"));
scan.withStopRow(Bytes.toBytes("user_2000"));

try (ResultScanner scanner = table.getScanner(scan)) {
    for (Result result : scanner) {
        System.out.println(result);
    }
}
```

## 10. 与 Hive 集成

Hive 可以通过外部表映射 HBase 表，便于使用 SQL 查询 HBase 数据。

示例：

```sql
CREATE EXTERNAL TABLE hbase_user_profile (
    rowkey STRING,
    name STRING,
    age STRING,
    order_count STRING
)
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES (
    "hbase.columns.mapping" = ":key,base:name,base:age,behavior:order_count"
)
TBLPROPERTIES (
    "hbase.table.name" = "user_profile"
);
```

这种方式适合少量分析查询，不适合高并发在线查询。

## 11. 性能优化

### 11.1 预分区

建表时提前划分 Region，避免初期所有写入集中到一个 Region。

```ruby
create 'user_profile', 'base', {SPLITS => ['10', '20', '30', '40']}
```

### 11.2 批量写入

批量写入比单条写入效率更高。Java 客户端可以使用 `Table.put(List<Put>)`。

### 11.3 BlockCache

BlockCache 主要优化读性能，适合热点查询。

### 11.4 BloomFilter

BloomFilter 可以减少不必要的磁盘读取，适合随机读场景。

### 11.5 压缩

常见压缩算法包括 Snappy、LZO、GZIP。生产环境常用 Snappy 平衡压缩率和性能。

## 12. 运维关注点

- Region 数量是否过多或过少。
- 是否存在热点 Region。
- MemStore Flush 是否频繁。
- Compaction 是否积压。
- HDFS 是否有坏块或容量不足。
- ZooKeeper 是否稳定。
- GC 是否频繁。
- 读写延迟是否异常。

## 13. HBase 与其他组件对比

| 组件 | 主要用途 | 特点 |
| --- | --- | --- |
| HBase | 海量明细随机读写 | 按 RowKey 快速查询 |
| Hive | 离线数仓分析 | SQL 能力强，延迟较高 |
| Kafka | 消息队列 | 高吞吐、顺序日志 |
| Redis | 缓存 | 内存读写快，容量成本高 |
| ClickHouse | OLAP 分析 | 列式分析查询快 |

## 14. 常见问题

### 14.1 HBase 为什么不适合复杂 SQL

HBase 主要面向 Key-Value 和范围扫描，不是关系型数据库。复杂 Join、聚合、多条件查询通常应交给 Hive、Spark 或 ClickHouse。

### 14.2 scan 慢怎么办

优先检查 RowKey 是否符合查询路径，是否扫描了过大范围，是否缺少过滤条件，是否有热点或 Region 过大。

### 14.3 数据如何建模

HBase 建模应从查询场景出发，而不是从关系模型出发。常见做法是适度冗余数据，用空间换查询效率。

## 15. 总结

HBase 适合海量数据的低延迟随机读写。学习 HBase 时，最重要的是理解数据模型和 RowKey 设计。只要 RowKey、列族、预分区和访问模式设计合理，HBase 可以稳定支撑大规模在线明细查询。
