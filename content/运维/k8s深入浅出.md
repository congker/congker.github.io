# K8s 深入浅出

## 1. Kubernetes 是什么

Kubernetes，简称 K8s，是一个容器编排平台，用于自动化部署、扩缩容、服务发现、负载均衡、故障恢复和配置管理。它解决的是多节点、多容器环境下的应用运行和治理问题。

Docker 负责把应用打包成容器，K8s 负责把容器稳定地运行在集群中。

## 2. 基础架构

一个 K8s 集群通常由控制平面和工作节点组成。

控制平面组件：

- `kube-apiserver`：集群统一入口，所有操作都经过 API Server。
- `etcd`：保存集群状态的键值数据库。
- `kube-scheduler`：负责把 Pod 调度到合适的节点。
- `kube-controller-manager`：负责控制器逻辑，例如副本数维护、节点状态检查。

工作节点组件：

- `kubelet`：运行在每个节点上，负责管理 Pod 生命周期。
- `kube-proxy`：负责 Service 网络转发。
- 容器运行时：例如 containerd、CRI-O。

## 3. 核心资源对象

### Pod

Pod 是 K8s 中最小的调度单元。一个 Pod 可以包含一个或多个容器，这些容器共享网络命名空间和存储卷。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
spec:
  containers:
    - name: nginx
      image: nginx:1.25
      ports:
        - containerPort: 80
```

### Deployment

Deployment 用于管理无状态应用，支持滚动更新、回滚和副本数控制。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
```

### Service

Service 为一组 Pod 提供稳定访问入口。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
spec:
  selector:
    app: nginx
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

常见类型：

- `ClusterIP`：集群内部访问，默认类型。
- `NodePort`：通过节点端口暴露服务。
- `LoadBalancer`：通过云厂商负载均衡器暴露服务。
- `ExternalName`：映射外部 DNS 名称。

### ConfigMap 与 Secret

ConfigMap 用于保存普通配置，Secret 用于保存敏感配置。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: production
  LOG_LEVEL: info
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
stringData:
  DB_PASSWORD: example-password
```

### Ingress

Ingress 用于管理 HTTP 和 HTTPS 入口，通常配合 Ingress Controller 使用。

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
spec:
  rules:
    - host: nginx.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: nginx-svc
                port:
                  number: 80
```

## 4. 常用 kubectl 命令

查看集群信息：

```bash
kubectl cluster-info
kubectl get nodes
```

查看资源：

```bash
kubectl get pods
kubectl get deploy
kubectl get svc
kubectl get ingress
```

查看详细信息：

```bash
kubectl describe pod pod-name
kubectl describe node node-name
```

查看日志：

```bash
kubectl logs pod-name
kubectl logs -f pod-name
kubectl logs deploy/nginx
```

进入容器：

```bash
kubectl exec -it pod-name -- sh
```

应用配置：

```bash
kubectl apply -f app.yaml
```

删除资源：

```bash
kubectl delete -f app.yaml
kubectl delete pod pod-name
```

## 5. 应用发布流程

典型流程：

1. 编写应用代码。
2. 构建 Docker 镜像。
3. 推送镜像到镜像仓库。
4. 修改 Deployment 中的镜像版本。
5. 使用 `kubectl apply` 发布。
6. 观察滚动更新状态。

示例：

```bash
kubectl set image deployment/nginx nginx=nginx:1.26
kubectl rollout status deployment/nginx
```

回滚：

```bash
kubectl rollout history deployment/nginx
kubectl rollout undo deployment/nginx
```

## 6. 调度与资源限制

资源请求和限制：

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

说明：

- `requests`：调度时使用，表示容器需要的最低资源。
- `limits`：运行时限制，防止单个容器占用过多资源。

节点选择：

```yaml
nodeSelector:
  disk: ssd
```

容忍污点：

```yaml
tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "gpu"
    effect: "NoSchedule"
```

## 7. 健康检查

K8s 支持存活探针、就绪探针和启动探针。

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 80
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 80
  initialDelaySeconds: 5
  periodSeconds: 5
```

- 存活探针失败：K8s 会重启容器。
- 就绪探针失败：Pod 会从 Service 后端摘除。
- 启动探针适合启动较慢的应用。

## 8. 存储

临时卷：

```yaml
volumes:
  - name: cache
    emptyDir: {}
```

持久化存储通常使用 PVC：

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

Pod 挂载 PVC：

```yaml
volumes:
  - name: data
    persistentVolumeClaim:
      claimName: data-pvc
```

## 9. 命名空间与权限

命名空间用于隔离资源：

```bash
kubectl create namespace dev
kubectl get pods -n dev
```

RBAC 用于控制权限，核心对象包括：

- `ServiceAccount`：服务账号。
- `Role` / `ClusterRole`：权限集合。
- `RoleBinding` / `ClusterRoleBinding`：把权限绑定给用户或服务账号。

生产环境应按最小权限原则配置 RBAC，避免给业务 Pod 使用过高权限。

## 10. 排查常见问题

Pod 一直 Pending：

- 节点资源不足。
- PVC 没有绑定成功。
- 节点选择器或亲和性规则不满足。
- 存在无法容忍的污点。

Pod 一直 CrashLoopBackOff：

- 应用启动命令错误。
- 配置文件缺失。
- 环境变量错误。
- 依赖服务不可达。

排查命令：

```bash
kubectl describe pod pod-name
kubectl logs pod-name --previous
kubectl get events --sort-by=.metadata.creationTimestamp
```

Service 无法访问：

- 检查 selector 是否匹配 Pod label。
- 检查 Pod readiness 是否通过。
- 检查端口和 targetPort 是否正确。
- 检查 NetworkPolicy 是否限制流量。

## 11. 生产实践建议

- 所有工作负载设置资源请求和限制。
- 使用明确镜像版本，避免生产环境使用 `latest`。
- 配置健康检查。
- 使用 HPA 进行自动扩缩容。
- 日志输出到标准输出，由日志系统统一采集。
- Secret 不应直接提交到代码仓库。
- 定期备份 etcd。
- 为关键服务配置 PodDisruptionBudget。
- 使用命名空间隔离环境和团队。
- 为集群组件、节点、Pod、Ingress 配置监控和告警。

## 12. 学习路线

建议按以下顺序学习：

1. 容器和镜像基础。
2. Pod、Deployment、Service。
3. ConfigMap、Secret、Ingress。
4. 存储、调度、健康检查。
5. RBAC、NetworkPolicy、安全上下文。
6. Helm、GitOps、监控、日志和告警。

