# Debian 12 性能优化

## 1. 优化前原则

性能优化应先观察，再调整，最后验证。不要在不了解瓶颈的情况下盲目修改系统参数。

推荐流程：

1. 明确目标：降低延迟、提高吞吐、减少内存占用，还是提升磁盘性能。
2. 收集基线：记录 CPU、内存、磁盘、网络、进程状态。
3. 单次只改一个变量。
4. 压测或观察一段时间。
5. 保留回滚方案。

## 2. 常用诊断工具

安装基础工具：

```bash
sudo apt update
sudo apt install -y htop sysstat iotop iftop nload dstat lsof strace tcpdump
```

CPU 和负载：

```bash
uptime
top
htop
mpstat -P ALL 1
```

内存：

```bash
free -h
vmstat 1
cat /proc/meminfo
```

磁盘：

```bash
df -h
lsblk
iostat -xz 1
iotop
```

网络：

```bash
ss -tunlp
iftop
nload
ip -s link
```

进程：

```bash
ps aux --sort=-%cpu | head
ps aux --sort=-%mem | head
lsof -p PID
strace -p PID
```

## 3. 系统更新与基础清理

保持系统安全更新：

```bash
sudo apt update
sudo apt upgrade -y
```

清理无用包：

```bash
sudo apt autoremove -y
sudo apt clean
```

查看开机启动服务：

```bash
systemctl list-unit-files --type=service --state=enabled
```

禁用不需要的服务：

```bash
sudo systemctl disable --now 服务名
```

不要禁用自己不了解的系统服务，尤其是网络、SSH、systemd、存储和安全相关服务。

## 4. CPU 优化

查看 CPU 信息：

```bash
lscpu
cat /proc/cpuinfo
```

查看当前频率策略：

```bash
cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

服务器场景通常可使用 `performance` 策略：

```bash
sudo apt install -y linux-cpupower
sudo cpupower frequency-set -g performance
```

持久化需要结合 systemd 服务或发行版提供的电源管理工具。笔记本或节能场景不建议长期使用 performance。

## 5. 内存与 Swap 优化

查看内存和 Swap：

```bash
free -h
swapon --show
```

调整 swappiness：

```bash
cat /proc/sys/vm/swappiness
sudo sysctl vm.swappiness=10
```

持久化：

```bash
echo "vm.swappiness=10" | sudo tee /etc/sysctl.d/99-performance.conf
sudo sysctl --system
```

建议：

- 内存充足的服务器可降低 swappiness，例如 `10`。
- 内存紧张的机器不要直接关闭 Swap。
- 数据库服务器应结合数据库自身缓存策略调整。

启用 zram 适合小内存机器：

```bash
sudo apt install -y zram-tools
sudo systemctl enable --now zramswap
```

## 6. 磁盘与文件系统优化

查看磁盘调度器：

```bash
cat /sys/block/sda/queue/scheduler
```

SSD/NVMe 通常适合 `none` 或 `mq-deadline`，机械盘可根据实际测试选择。

临时修改示例：

```bash
echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler
```

挂载参数优化示例：

```fstab
UUID=xxxx / ext4 defaults,noatime 0 1
```

`noatime` 可以减少文件访问时间写入，适合多数服务器场景。

SSD 定期 TRIM：

```bash
sudo systemctl enable --now fstrim.timer
systemctl status fstrim.timer
```

查看磁盘占用：

```bash
sudo du -h --max-depth=1 / | sort -h
```

## 7. 网络优化

查看连接状态：

```bash
ss -s
ss -tunap
```

常见 sysctl 参数示例：

```conf
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.ip_local_port_range = 10240 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
```

写入配置：

```bash
sudo tee /etc/sysctl.d/99-network-performance.conf >/dev/null <<'EOF'
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 4096
net.ipv4.ip_local_port_range = 10240 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
EOF

sudo sysctl --system
```

注意：

- 参数值应结合业务连接规模调整。
- 高并发服务还需要调整应用自身连接池、worker 数和 backlog。
- 云服务器还受安全组、云网络和负载均衡限制影响。

## 8. 文件句柄与进程限制

查看当前限制：

```bash
ulimit -n
ulimit -u
```

临时修改：

```bash
ulimit -n 65535
```

systemd 服务建议在 unit 中设置：

```ini
[Service]
LimitNOFILE=65535
LimitNPROC=65535
```

重新加载：

```bash
sudo systemctl daemon-reload
sudo systemctl restart 服务名
```

全局限制可在 `/etc/security/limits.conf` 或 `/etc/security/limits.d/*.conf` 中配置，但 systemd 管理的服务通常以 unit 配置为准。

## 9. systemd 服务优化

查看启动耗时：

```bash
systemd-analyze
systemd-analyze blame
systemd-analyze critical-chain
```

减少启动项：

```bash
systemctl list-unit-files --type=service --state=enabled
sudo systemctl disable --now 服务名
```

服务资源限制示例：

```ini
[Service]
CPUQuota=200%
MemoryMax=2G
Restart=always
RestartSec=3
```

这些配置可防止单个服务拖垮整台机器。

## 10. 日志优化

查看 journald 占用：

```bash
journalctl --disk-usage
```

限制日志大小：

```ini
[Journal]
SystemMaxUse=1G
SystemMaxFileSize=100M
MaxRetentionSec=30day
```

配置文件路径：

```bash
/etc/systemd/journald.conf
```

修改后重启：

```bash
sudo systemctl restart systemd-journald
```

清理旧日志：

```bash
sudo journalctl --vacuum-time=30d
sudo journalctl --vacuum-size=1G
```

## 11. 安全与性能的平衡

性能优化不应牺牲基本安全：

- 不要关闭防火墙来换取微弱性能提升。
- 不要关闭安全更新。
- 不要随意给服务 root 权限。
- 不要把内核参数复制到所有机器上，应按业务验证。
- 对公网服务，应保留访问日志和关键审计日志。

## 12. 面向 Web 服务的优化清单

适用于 Nginx、Apache、Node.js、Java、Go 等常见服务：

- 调整文件句柄限制到 `65535` 或更高。
- 确认应用监听 `0.0.0.0` 或正确网卡地址。
- 配置反向代理 keepalive。
- 启用 gzip、brotli 或静态资源压缩。
- 静态资源设置缓存头。
- 数据库连接池大小与数据库承载能力匹配。
- 使用进程管理或 systemd 自动重启。
- 配置日志轮转，避免磁盘写满。
- 监控 CPU、内存、磁盘、网络和应用错误率。

## 13. 回滚建议

每次优化前记录原始值：

```bash
sysctl -a > sysctl-before.txt
systemctl list-unit-files > services-before.txt
```

修改配置前备份：

```bash
sudo cp /etc/sysctl.conf /etc/sysctl.conf.bak
sudo cp /etc/systemd/journald.conf /etc/systemd/journald.conf.bak
```

出现异常时优先回滚最近一次修改，并通过监控确认恢复效果。

