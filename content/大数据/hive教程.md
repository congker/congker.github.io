# Hive 教程

## 1. Hive 是什么

Apache Hive 是构建在 Hadoop 生态上的数据仓库工具。它允许用户使用类 SQL 的 HiveQL 查询存储在 HDFS、对象存储或其他兼容存储中的大规模数据。

Hive 的核心价值是让数据分析人员可以用 SQL 处理海量离线数据，而不需要直接编写 MapReduce、Tez 或 Spark 程序。

Hive 常用于以下场景：

- 离线数仓
- 日志分析
- 批量 ETL
- 用户行为分析
- 报表统计
- 数据集市建设

## 2. Hive 的特点

### 2.1 SQL 化分析

Hive 提供 HiveQL，语法接近 SQL，降低了大数据分析门槛。

### 2.2 面向离线计算

Hive 更适合大规模批处理，不适合高并发、低延迟的在线查询。

### 2.3 可扩展存储

Hive 可以管理 HDFS、对象存储、本地文件系统等位置上的数据。

### 2.4 元数据管理

Hive 使用 Metastore 管理表、字段、分区、存储格式和数据位置等元信息。

### 2.5 多计算引擎

Hive 可以对接 MapReduce、Tez、Spark 等执行引擎。实际生产环境中常使用 Tez 或 Spark 提升查询性能。

## 3. Hive 架构

Hive 主要组件：

- Client：包括 CLI、Beeline、JDBC、ODBC 等客户端。
- Driver：负责解析 SQL、生成执行计划、协调任务运行。
- Compiler：将 HiveQL 编译成执行计划。
- Metastore：保存数据库、表、分区、字段等元数据。
- Execution Engine：执行底层计算任务。
- Storage：通常是 HDFS 或对象存储。

查询流程大致如下：

```text
提交 SQL -> 解析 SQL -> 读取元数据 -> 生成执行计划 -> 提交执行引擎 -> 读取数据 -> 返回结果
```

## 4. 安装 Hive

### 4.1 前置条件

需要先准备：

- Java
- Hadoop
- MySQL 或 PostgreSQL，作为生产环境 Metastore 数据库

学习环境可以使用内置 Derby，但 Derby 不适合多人或生产使用。

### 4.2 下载并解压

```bash
wget https://archive.apache.org/dist/hive/hive-3.1.3/apache-hive-3.1.3-bin.tar.gz
tar -zxvf apache-hive-3.1.3-bin.tar.gz
cd apache-hive-3.1.3-bin
```

### 4.3 配置环境变量

```bash
export HIVE_HOME=/opt/apache-hive-3.1.3-bin
export PATH=$PATH:$HIVE_HOME/bin
```

### 4.4 配置 hive-site.xml

示例：

```xml
<configuration>
  <property>
    <name>javax.jdo.option.ConnectionURL</name>
    <value>jdbc:mysql://localhost:3306/hive_metastore?createDatabaseIfNotExist=true</value>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionDriverName</name>
    <value>com.mysql.cj.jdbc.Driver</value>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionUserName</name>
    <value>hive</value>
  </property>
  <property>
    <name>javax.jdo.option.ConnectionPassword</name>
    <value>hive_password</value>
  </property>
  <property>
    <name>hive.metastore.warehouse.dir</name>
    <value>/user/hive/warehouse</value>
  </property>
</configuration>
```

### 4.5 初始化元数据库

```bash
schematool -dbType mysql -initSchema
```

### 4.6 启动 Hive

启动 Metastore：

```bash
hive --service metastore
```

启动 HiveServer2：

```bash
hive --service hiveserver2
```

使用 Beeline 连接：

```bash
beeline -u jdbc:hive2://localhost:10000
```

## 5. Hive 数据库操作

### 5.1 创建数据库

```sql
CREATE DATABASE bigdata;
```

指定位置：

```sql
CREATE DATABASE bigdata
LOCATION '/warehouse/bigdata.db';
```

### 5.2 查看数据库

```sql
SHOW DATABASES;
```

### 5.3 使用数据库

```sql
USE bigdata;
```

### 5.4 删除数据库

```sql
DROP DATABASE bigdata;
```

强制删除：

```sql
DROP DATABASE bigdata CASCADE;
```

## 6. Hive 表类型

### 6.1 内部表

内部表也叫管理表。删除表时，Hive 会同时删除元数据和数据。

```sql
CREATE TABLE user_info (
    user_id STRING,
    name STRING,
    age INT
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ',';
```

### 6.2 外部表

外部表删除时只删除元数据，不删除底层数据。

```sql
CREATE EXTERNAL TABLE ods_user_log (
    user_id STRING,
    event_type STRING,
    event_time STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
LOCATION '/data/ods/user_log';
```

外部表适合管理已有数据目录，生产环境中更常见。

## 7. 加载数据

### 7.1 从本地加载

```sql
LOAD DATA LOCAL INPATH '/tmp/user_info.csv'
INTO TABLE user_info;
```

### 7.2 从 HDFS 加载

```sql
LOAD DATA INPATH '/data/user_info.csv'
INTO TABLE user_info;
```

### 7.3 覆盖加载

```sql
LOAD DATA INPATH '/data/user_info.csv'
OVERWRITE INTO TABLE user_info;
```

## 8. 分区表

分区可以减少扫描范围，提高查询效率。

### 8.1 创建分区表

```sql
CREATE TABLE user_event (
    user_id STRING,
    event_type STRING,
    event_time STRING
)
PARTITIONED BY (dt STRING)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ',';
```

### 8.2 写入分区

```sql
INSERT INTO TABLE user_event PARTITION (dt='2026-06-11')
SELECT user_id, event_type, event_time
FROM ods_user_event;
```

### 8.3 查询分区

```sql
SELECT event_type, COUNT(*)
FROM user_event
WHERE dt = '2026-06-11'
GROUP BY event_type;
```

### 8.4 查看分区

```sql
SHOW PARTITIONS user_event;
```

### 8.5 添加分区

```sql
ALTER TABLE user_event ADD PARTITION (dt='2026-06-11');
```

### 8.6 删除分区

```sql
ALTER TABLE user_event DROP PARTITION (dt='2026-06-11');
```

## 9. 分桶表

分桶按照字段哈希值将数据拆分到固定数量的文件中，适合抽样、Join 优化等场景。

```sql
CREATE TABLE user_bucket (
    user_id STRING,
    name STRING,
    age INT
)
CLUSTERED BY (user_id) INTO 8 BUCKETS
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ',';
```

写入分桶表通常使用 `INSERT INTO ... SELECT ...`，让 Hive 按分桶规则生成文件。

## 10. 常用 HiveQL

### 10.1 查询

```sql
SELECT user_id, name, age
FROM user_info
WHERE age >= 18
LIMIT 10;
```

### 10.2 聚合

```sql
SELECT event_type, COUNT(*) AS cnt
FROM user_event
WHERE dt = '2026-06-11'
GROUP BY event_type;
```

### 10.3 去重

```sql
SELECT COUNT(DISTINCT user_id)
FROM user_event
WHERE dt = '2026-06-11';
```

### 10.4 Join

```sql
SELECT a.user_id, a.event_type, b.name
FROM user_event a
LEFT JOIN user_info b
ON a.user_id = b.user_id
WHERE a.dt = '2026-06-11';
```

### 10.5 Insert Overwrite

```sql
INSERT OVERWRITE TABLE dws_user_event_summary PARTITION (dt='2026-06-11')
SELECT user_id, COUNT(*) AS event_count
FROM user_event
WHERE dt = '2026-06-11'
GROUP BY user_id;
```

## 11. 存储格式

### 11.1 TextFile

默认文本格式，易读但压缩率和查询性能较差。

### 11.2 ORC

列式存储格式，适合 Hive 查询，支持压缩、索引和谓词下推。

```sql
CREATE TABLE user_orc (
    user_id STRING,
    name STRING,
    age INT
)
STORED AS ORC;
```

### 11.3 Parquet

通用列式存储格式，常用于 Hive、Spark、Presto、Trino 等组件之间共享数据。

```sql
CREATE TABLE user_parquet (
    user_id STRING,
    name STRING,
    age INT
)
STORED AS PARQUET;
```

生产环境中，明细层和汇总层常使用 ORC 或 Parquet，而不是 TextFile。

## 12. 压缩

压缩可以减少存储成本和 IO 开销。常见压缩格式包括 Snappy、Gzip、LZO、ZSTD。

示例：

```sql
SET hive.exec.compress.output=true;
SET mapreduce.output.fileoutputformat.compress=true;
SET mapreduce.output.fileoutputformat.compress.codec=org.apache.hadoop.io.compress.SnappyCodec;
```

ORC 表压缩示例：

```sql
CREATE TABLE user_orc_snappy (
    user_id STRING,
    name STRING,
    age INT
)
STORED AS ORC
TBLPROPERTIES ("orc.compress"="SNAPPY");
```

## 13. 动态分区

动态分区适合按数据字段自动写入不同分区。

```sql
SET hive.exec.dynamic.partition=true;
SET hive.exec.dynamic.partition.mode=nonstrict;

INSERT OVERWRITE TABLE user_event PARTITION (dt)
SELECT user_id, event_type, event_time, dt
FROM ods_user_event;
```

使用动态分区时要控制分区数量，避免一次任务创建过多小分区。

## 14. 小文件问题

Hive 查询大量小文件时会产生额外的元数据和任务调度开销。

常见解决方法：

- 上游写入时控制文件大小。
- 使用 `INSERT OVERWRITE` 合并小文件。
- 开启任务输出合并配置。
- 按合理粒度设计分区。
- 避免过细分区，例如按小时甚至分钟无限制建分区。

## 15. 数据仓库分层

常见 Hive 数仓分层：

| 层级 | 含义 | 作用 |
| --- | --- | --- |
| ODS | 原始数据层 | 保存业务原始数据 |
| DWD | 明细数据层 | 清洗、标准化、明细建模 |
| DWS | 汇总数据层 | 面向主题做轻度汇总 |
| ADS | 应用数据层 | 支撑报表、看板、业务应用 |
| DIM | 维度层 | 保存维度表 |

示例链路：

```text
业务库/日志 -> ODS -> DWD -> DWS -> ADS -> 报表
```

## 16. 性能优化

### 16.1 分区裁剪

查询分区表时必须带上分区条件：

```sql
SELECT COUNT(*)
FROM user_event
WHERE dt = '2026-06-11';
```

### 16.2 列式存储

优先使用 ORC 或 Parquet，减少不必要的列读取。

### 16.3 MapJoin

小表 Join 大表时，可以使用 MapJoin：

```sql
SELECT /*+ MAPJOIN(b) */ a.user_id, b.name
FROM user_event a
JOIN user_info b
ON a.user_id = b.user_id;
```

### 16.4 数据倾斜处理

常见方式：

- 过滤异常 Key。
- 对热点 Key 单独处理。
- 给 Key 加随机前缀后分两阶段聚合。
- 开启 Hive 的倾斜 Join 优化参数。

### 16.5 合理设置执行参数

常用参数：

```sql
SET hive.execution.engine=tez;
SET hive.exec.parallel=true;
SET hive.vectorized.execution.enabled=true;
SET hive.cbo.enable=true;
```

## 17. 常见问题

### 17.1 Hive 和 MySQL 有什么区别

MySQL 是关系型数据库，适合在线事务和低延迟查询。Hive 是大数据数仓工具，适合离线批量分析，不适合高并发点查。

### 17.2 为什么 Hive 查询慢

常见原因包括数据量大、没有分区裁剪、使用 TextFile、大量小文件、Join 数据倾斜、资源不足、执行引擎配置不合理。

### 17.3 内部表和外部表怎么选

生产环境通常优先使用外部表，因为删除表时不会误删底层数据。临时表或中间表可以使用内部表。

### 17.4 分区越多越好吗

不是。分区过多会增加 Metastore 压力和文件管理成本。分区粒度应根据查询条件和数据规模设计。

## 18. 总结

Hive 是大数据离线数仓的核心组件。学习 Hive 时，需要重点掌握：

1. 数据库、表、外部表
2. 分区和分桶
3. HiveQL 查询
4. ORC、Parquet 等存储格式
5. 动态分区和小文件治理
6. 数仓分层建模
7. SQL 性能优化

掌握这些内容后，就可以基于 Hive 构建稳定的离线数据仓库和批处理分析链路。

![Hive 教程配图](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6RiVVmrYrmdACfLeGPg28-Z-NeztlRM2prQ&s)
