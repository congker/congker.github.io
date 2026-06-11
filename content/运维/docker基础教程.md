# Docker 基础教程

## 1. Docker 是什么

Docker 是一种容器化平台，用于把应用程序及其运行依赖打包到一个独立、可移植的运行环境中。相比传统虚拟机，容器共享宿主机内核，启动更快、资源占用更低，适合开发、测试、部署和持续集成场景。

核心概念：

- 镜像：应用运行环境的只读模板，例如 `nginx:latest`、`mysql:8.0`。
- 容器：镜像运行后的实例，可以启动、停止、删除。
- 仓库：保存镜像的远程服务，例如 Docker Hub、Harbor。
- Dockerfile：用于定义镜像构建过程的文本文件。
- 数据卷：用于持久化容器数据。
- 网络：用于容器之间、容器与宿主机之间通信。

## 2. 安装后常用检查

```bash
docker version
docker info
docker run hello-world
```

如果 `hello-world` 可以正常运行，说明 Docker 引擎和镜像拉取能力基本正常。

## 3. 镜像管理

查看本地镜像：

```bash
docker images
```

拉取镜像：

```bash
docker pull nginx:latest
docker pull debian:12
```

删除镜像：

```bash
docker rmi nginx:latest
```

查看镜像详细信息：

```bash
docker inspect nginx:latest
```

## 4. 容器管理

启动一个 Nginx 容器：

```bash
docker run -d --name web -p 8080:80 nginx:latest
```

参数说明：

- `-d`：后台运行。
- `--name web`：指定容器名称。
- `-p 8080:80`：把宿主机 8080 端口映射到容器 80 端口。

查看运行中的容器：

```bash
docker ps
```

查看所有容器：

```bash
docker ps -a
```

停止、启动、重启容器：

```bash
docker stop web
docker start web
docker restart web
```

删除容器：

```bash
docker rm web
```

强制删除运行中的容器：

```bash
docker rm -f web
```

## 5. 进入容器与查看日志

进入容器：

```bash
docker exec -it web bash
```

如果镜像没有 `bash`，可尝试：

```bash
docker exec -it web sh
```

查看日志：

```bash
docker logs web
docker logs -f web
docker logs --tail 100 web
```

## 6. 数据持久化

容器删除后，容器内部文件系统中的数据也会随之删除。生产环境通常使用数据卷持久化数据。

创建数据卷：

```bash
docker volume create nginx-data
```

挂载数据卷：

```bash
docker run -d --name web -p 8080:80 -v nginx-data:/usr/share/nginx/html nginx:latest
```

查看数据卷：

```bash
docker volume ls
docker volume inspect nginx-data
```

也可以绑定宿主机目录：

```bash
docker run -d --name web -p 8080:80 -v /data/html:/usr/share/nginx/html nginx:latest
```

## 7. Dockerfile 入门

示例：构建一个简单 Node.js 应用镜像。

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

构建镜像：

```bash
docker build -t my-node-app:1.0 .
```

运行镜像：

```bash
docker run -d --name node-app -p 3000:3000 my-node-app:1.0
```

Dockerfile 常用指令：

- `FROM`：指定基础镜像。
- `WORKDIR`：设置工作目录。
- `COPY`：复制文件到镜像中。
- `RUN`：构建镜像时执行命令。
- `EXPOSE`：声明服务端口。
- `CMD`：容器启动时默认执行的命令。

## 8. Docker 网络

查看网络：

```bash
docker network ls
```

创建自定义网络：

```bash
docker network create app-net
```

让两个容器加入同一网络：

```bash
docker run -d --name mysql --network app-net -e MYSQL_ROOT_PASSWORD=123456 mysql:8.0
docker run -d --name web --network app-net -p 8080:80 nginx:latest
```

同一自定义网络中的容器可以通过容器名访问，例如应用可以用 `mysql:3306` 连接数据库。

## 9. Docker Compose 基础

`docker compose` 适合管理多容器应用。示例 `compose.yaml`：

```yaml
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html

  redis:
    image: redis:7
```

启动：

```bash
docker compose up -d
```

查看：

```bash
docker compose ps
docker compose logs -f
```

停止并删除：

```bash
docker compose down
```

## 10. 常用清理命令

清理停止的容器：

```bash
docker container prune
```

清理未使用镜像：

```bash
docker image prune
```

清理未使用数据卷：

```bash
docker volume prune
```

清理未使用网络：

```bash
docker network prune
```

谨慎使用：

```bash
docker system prune -a
```

该命令会删除所有未使用的镜像、容器、网络和构建缓存，执行前应确认没有需要保留的镜像。

## 11. 排查思路

容器启动失败：

```bash
docker logs 容器名
docker inspect 容器名
```

端口无法访问：

- 检查 `docker ps` 中端口映射是否正确。
- 检查宿主机防火墙。
- 检查应用是否监听在 `0.0.0.0`，而不是只监听 `127.0.0.1`。

镜像拉取慢：

- 配置镜像加速器。
- 使用私有镜像仓库。
- 在 CI/CD 中缓存基础镜像。

磁盘占用过高：

```bash
docker system df
docker builder prune
```

## 12. 最佳实践

- 镜像使用明确版本号，避免生产环境直接使用 `latest`。
- 一个容器只运行一个主要进程。
- 业务数据使用数据卷或外部存储。
- 不要把密码、密钥写进镜像。
- 使用 `.dockerignore` 减少构建上下文。
- 生产环境限制容器 CPU 和内存。
- 定期清理无用镜像和构建缓存。

