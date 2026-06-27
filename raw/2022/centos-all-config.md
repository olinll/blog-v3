# 「全」CentOS 安装与服务器初始化配置完整指南

> 详述 CentOS 从零安装、分区到网络与防火墙配置全流程。助你快速构建稳定、安全的生产级 Web 服务器环境。

<alert title="文章合并说明">

因为Centos7 系统已经全面停止维护，所以我们将之前的Centos安装组件的文章全部合并至此文章下方，您可以点击下方章节链接跳转：

</alert>

<alert type="error" title="CentOS停更说明">

CentOS 7 操作系统已全面停止维护（EOL），继续使用会使系统暴露在新的安全漏洞之下，成为攻击目标，并可能违反相关安全合规要求。

阿里云：[CentOS 操作系统](https://help.aliyun.com/zh/ecs/user-guide/options-for-dealing-with-centos-linux-end-of-life)

</alert>

## 一、下载镜像

Centos7镜像包：（此镜像为华为镜像站镜像）

<tip :copy="true" tip="点击复制">

[https://mirrors.huaweicloud.com/centos/7/isos/x86_64/CentOS-7-x86_64-DVD-2009.iso](https://mirrors.huaweicloud.com/centos/7/isos/x86_64/CentOS-7-x86_64-DVD-2009.iso)

</tip>

烧录镜像（二选一）

- 使用 [Ventoy启动盘](https://www.ventoy.net/cn/index.html)
- 使用 [Rufus](https://rufus.ie/zh/)
- 使用 [Balenaetcher](https://etcher.balena.io/)
- 或者第三方镜像烧录工具

之后启动到U盘，进入安装流程，里面没什么可说的，都是可视化安装，下一步下一步即可。

## 二、开始安装

网络配置可以在安装界面配置，也可以使用 dhcp 在安装完成后配置，但是开关一定要打开，不然无法使用SSH连接，如果在安装的时候没有网络，也可以关闭，然后后面手动开启网卡服务。

<pic caption="配置静态IP" src="https://oss.olinl.com/centos-all-config/20260627092337_iek0.webp">



</pic>

如果root密码设置过于简单，需要点击两次完成才可继续安装。

## 三、系统配置

在我们安装完成一个系统后，通常需要进行一些必要的优化

### 1. 修改 IP 地址

可以先ping一下外网是否可以访问

```bash
ping baidu.com
```

```bash
# 网络正常
[root@harbor ~]# ping baidu.com
PING baidu.com (110.242.74.102) 56(84) bytes of data.
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=1 ttl=51 time=20.2 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=2 ttl=51 time=20.0 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=3 ttl=51 time=26.6 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=4 ttl=51 time=20.0 ms
64 bytes from 110.242.74.102 (110.242.74.102): icmp_seq=5 ttl=51 time=20.0 ms
^C
--- baidu.com ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4004ms
rtt min/avg/max/mdev = 20.061/21.424/26.605/2.595 ms
```

如果没有打印延迟等信息，就说明网络是断开的。

**查看网卡名称**

```bash
#查看网卡，通常是ens开头的
ip addr
```

```bash
# 查看网卡名称为ens33
[root@172-0-0-12 ~]# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:0c:29:06:59:5c brd ff:ff:ff:ff:ff:ff
    inet 172.0.0.12/24 brd 172.0.0.255 scope global noprefixroute ens33
       valid_lft forever preferred_lft forever
    inet6 fe80::e1ff:d529:c8cb:6d1a/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

**修改网卡配置**

```bash
# 修改网卡配置
# vi /etc/sysconfig/network-scripts/ifcfg-<网卡名称>
vi /etc/sysconfig/network-scripts/ifcfg-ens33
```

修改关键字段：

```bash
BOOTPROTO=static
ONBOOT=yes
IPADDR=192.168.1.100
NETMASK=255.255.255.0
GATEWAY=192.168.1.1
DNS1=8.8.8.8
```

> `BOOTPROTO`=static - 静态ip<br />
> 
> `ONBOOT`=yes - 启动时自动激活<br />
> 
> `IPADDR`=192.168.1.100 - ip地址<br />
> 
> `NETMASK`=255.255.255.0 - 掩码，通常为255.255.255.0<br />
> 
> `GATEWAY`=192.168.1.1 - 网关<br />
> 
> `DNS1`=8.8.8.8 - DNS地址

修改完成后保存，重启network服务

```bash
service network restart

# 对于使用旧版network服务的系统
/etc/init.d/network restart
/etc/init.d/network stop && /etc/init.d/network start
```

然后就可以正常联网了。

### 2. 更换yum源

<alert type="warning" :card="true">

由于centos7已经停止服务，部分源已经无法访问，如果显示404等问题，请自行寻找可用源

</alert>

```bash
# 备份yum源
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup

# 下载国内yum源配置文件
## 如果无法使用可以手动创建文件然后复制进去
vi /etc/yum.repos.d/CentOS-Base.repo
## 阿里源（推荐）：
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
### 当wget无法使用时
#curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
## 网易源：
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.163.com/.help/CentOS7-Base-163.repo
### 当wget无法使用时
#curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.163.com/.help/CentOS7-Base-163.repo

# 清理yum缓存，并生成新的缓存
yum clean all
yum makecache

# 更新yum源
yum update -y
```

### 3. 硬盘操作

此操作可以借助lvm2工具，详细操作见另一篇文章：

<link-card description="使用LVM进行创建分区,扩容分区等操作" icon="https://picsum.photos/100/100" link="/2024/lvm-guide" title="LVM 硬盘工具使用教程">



</link-card>

### 4. 配置 SELinux

SELinux 是 CentOS 7 的安全模块，它可以提高系统的安全性。但是，如果不正确配置，它可能会导致一些问题。以下是一些常见的 SELinux 配置

```bash
# 临时禁用SELinux
setenforce 0

# 永久禁用SELinux
vi /etc/selinux/config
## 修改为下面内容
SELINUX=disabled

#注意！修改后需重启系统才能生效
```

## 四、 安装必要的软件包

```bash
yum -y install  epel-release
yum -y install wget vim net-tools telnet lsof tree htop zip unzip iperf3
```

<note>

- wget：用于下载文件和网页
- vim：用于编辑文本文件
- net-tools：用于管理网络配置
- telnet：用于测试网络连接
- lsof：用于查看系统打开的文件
- tree：用于查看目录结构
- htop：用于更好的查看进程
- zip、unzip：用于解压缩zip文件
- iperf3：内网测速工具

</note>

## 五、防火墙操作

通常情况下我们使用的是 vpc，云厂商会自带防火墙服务，我们可以将防火墙直接关闭。

```bash
# 停止防火墙服务
systemctl stop firewalld.service
# 停止开机自启
systemctl disable firewalld.service
```

如果你认为系统的防火墙非常重要，想要使用，请往下看

**添加一个端口**

```bash
# 添加端口
## --permanent永久生效，没有此参数重启后失效
firewall-cmd --zone=public --add-port=5005/tcp --permanent

# 添加端口外部访问权限（这样外部才能访问）
firewall-cmd --add-port=5005/tcp

# 更新防火墙规则
firewall-cmd --reload
```

**查看端口是否开放**

```bash
firewall-cmd --zone=public --query-port=80/tcp
```

**删除开放的端口**

```bash
firewall-cmd --zone=public --remove-port=80/tcp --permanent
```

**查看firewall是否运行**

```bash
# 两个命令都可以
systemctl status firewalld

firewall-cmd --state
```

**查看开启了哪些服务**

```bash
firewall-cmd --list-services
```

**查看所有打开的端口**

```bash
firewall-cmd --zone=public --list-ports
```

## 六、一键运行脚本

**包含更新阿里yum源，安装软件包，关闭防火墙**

```bash
yum install wget -y
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
curl -o /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
yum clean all
yum makecache
yum update -y
yum -y install  epel-release
yum -y install wget vim net-tools telnet lsof tree htop zip unzip iperf3
systemctl stop firewalld.service
systemctl disable firewalld.service
```

## 七、常用命令

### 1. 修改主机名

```bash
# 查看主机名
hostname
# 修改主机名
hostnamectl set-hostname 主机名
```

### 2. 配置免密登录

```bash
# 在A客户端上生成公钥和私钥
ssh-keygen -t rsa


# ====================================================
# 拷贝及配置方案
ssh-copy-id -i ~/.ssh/id_rsa.pub 'root@要拷贝到的机器ip'
```

### 3. 配置hosts

服务器多的时候可以配置hosts，直接通过关键字访问，避免使用ip访问，以免更换ip时还要修改配置

```bash [/etc/hosts]
vim /etc/hosts

# 添加配置格式
#ip地址 别名
192.168.0.100 vm100
```

```bash [或者使用heredoc写入]
# 使用heredoc写入
sudo tee -a /etc/hosts << EOF
192.168.0.100 vm100
EOF
```

### 4. 使用scp传输文件

**从服务器上下载文件**

例如：把 192.168.0.101 上的 /data/test.txt 的文件下载到 /home（本地目录）

```bash
#scp 用户名@服务器地址:要下载的文件路径 保存文件的文件夹路径
scp root@192.168.0.101:/data/test.txt /home
```

**上传本地文件到服务器**

例如：把本机 /home/test.txt 文件上传到 192.168.0.101 这台服务器上的 /data/ 目录中

```bash
#scp 要上传的文件路径 用户名@服务器地址:服务器保存路径
scp /home/test.txt root@192.168.0.101:/data/
```

**从服务器下载整个目录**

例如：把 192.168.0.101 上的 /data 目录下载到 /home（本地目录）

```bash
#scp -r 用户名@服务器地址:要下载的服务器目录 保存下载的目录
scp -r root@192.168.0.101:/data  /home/
```

**上传目录到服务器**

例如：把 /home 目录上传到服务器的 /data/ 目录

```bash
#scp -r 要上传的目录 用户名@服务器地址:服务器的保存目录
scp -r /home root@192.168.0.101:/data/
```

### 5. 安装rpm包

```bash
# 批量安装rpm
rpm -ivh *.rpm

# 查询并过滤已安装的软件包
## -qa 参数表示查询所有（-q）已安装的软件包（-a）grep表示过滤
rpm -qa | grep firefox

# 卸载
rpm -e firefox

# 带参数安装
rpm -ivh *.rpm --nodeps --force
```

### 6. 赋权

```bash
# 赋予读写权限
chmod -R 777 文件或目录
# chmod -R 777 /usr/local/mysql/*

# 赋予可执行权限
chmod +x 文件
```

### 7. 查看端口占用

```bash
yum -y install lsof

lsof -i tcp:80

# 关掉占用的服务
kill pid
kill -9 pid
```

---

## 八、Kafka 跨平台安装与基础使用指南（Linux / Windows）

<alert>

介绍在 Linux 和 Windows 下安装 Apache Kafka，配置 ZooKeeper 与 Kafka Broker，并演示常用的 Topic 管理与消息生产消费命令。

</alert>

---

<alert type="question">

Kafka 2.8+ 已支持 KRaft，3.3+ 推荐生产使用，无需单独维护 ZooKeeper

</alert>

Kafka 下载地址：[https://kafka.apache.org/downloads](https://kafka.apache.org/downloads)

<pic caption="下载Kafka软件包" src="https://oss.olinl.com/centos-all-config/20260627093301_tbfo.webp">



</pic>

### 安装

Linux 下载并解压：

```bash
# 解压到指定目录
tar -zxvf kafka_2.13-3.5.1.tgz
mv kafka_2.13-3.5.1 /opt/kafka
```

Windows 直接解压到合适路径即可（建议纯英文路径，如 `D:\env-java\`）。

<note>

- Linux 命令在 `bin/` 目录下执行
- Windows 命令在 `bin\windows\` 目录下执行

</note>

### 修改配置

编辑 `config/server.properties` 和 `config/zookeeper.properties`：

```bash
# Linux 配置示例
broker.id=1
log.dirs=/opt/kafka/logs

# Windows 配置示例
broker.id=1
log.dirs=D:/env-java/kafka_2.13-3.5.1/kafka-logs
```

### 启动服务

```bash
# 启动 ZooKeeper
## Linux
bin/zookeeper-server-start.sh -daemon config/zookeeper.properties
## Windows
bin\windows\zookeeper-server-start.bat config\zookeeper.properties

# 启动 Kafka
## Linux（后台启动，推荐）
cd /opt/kafka
nohup bin/kafka-server-start.sh config/server.properties 2>&1 &
# 或者
bin/kafka-server-start.sh -daemon config/server.properties

## Windows
bin\windows\kafka-server-start.bat config\server.properties
```

### 常用操作

```bash
# 创建 Topic
## Linux
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 \
  --replication-factor 1 --partitions 1 --topic test

# 查看 Topic 列表
bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# 查看 Topic 详情
bin/kafka-topics.sh --describe --bootstrap-server localhost:9092 --topic test

# 删除 Topic
bin/kafka-topics.sh --delete --bootstrap-server localhost:9092 --topic test

# 启动 Producer（生产者）
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic test

# 启动 Consumer（消费者，从头消费）
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic test --from-beginning

# 删除 Topic 数据（需要 delete_script.json 文件）
bin/kafka-delete-records.sh --bootstrap-server localhost:9092 \
  --offset-json-file delete_script.json
```

`delete_script.json` 文件格式：

```json
{
  "partitions": [
    {
      "topic": "test",
      "partition": 0,
      "offset": -1
    }
  ]
}
```

## 九、CentOS 安装 MongoDB 3.4 并配置认证

<alert>

在 CentOS 上通过 YUM 仓库安装 MongoDB 3.4，配置外部访问与用户密码认证，适合内网开发环境快速搭建。

</alert>

---

### 添加 YUM 仓库并安装

创建 MongoDB 仓库文件：

```ini [/etc/yum.repos.d/mongodb-org-3.4.repo]
[mongodb-org-3.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
```

```bash
# 安装 MongoDB
yum install -y mongodb-org
```

### 启动服务

```bash
# 启动
systemctl start mongod.service
# 停止
systemctl stop mongod.service
# 重启
systemctl restart mongod.service
# 设置开机自启
systemctl enable mongod
```

### 配置外部访问

```bash
# 修改配置文件
vim /etc/mongod.conf
```

找到 `bindIp` 字段，将其改为 `0.0.0.0`：

```yaml [/etc/mongod.conf]
# 修改前
bindIp: 127.0.0.1
# 修改后
bindIp: 0.0.0.0
```

```bash
# 重启使配置生效
systemctl restart mongod
```

连接 MongoDB：

```bash
mongo 127.0.0.1:27017
```

默认数据目录：`/var/lib/mongo`

默认日志目录：`/var/log/mongodb`

如需修改，在 `/etc/mongod.conf` 中调整对应路径。

### 配置用户认证

先以无认证方式登录：

```bash
mongo 127.0.0.1:27017
```

在 MongoDB Shell 中创建管理员用户：

```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "your_password",
  roles: [{ role: "root", db: "admin" }]
})
```

开启认证：

```yaml [/etc/mongod.conf]
security:
  authorization: enabled
```

```bash
# 重启服务
systemctl restart mongod
```

重启后使用认证方式登录：

```bash
mongo 127.0.0.1:27017 -u admin -p your_password --authenticationDatabase admin
```

## 十、CentOS 安装 MySQL 5.7 完整指南

<alert>

详解在 CentOS 7 上通过 RPM 包安装 MySQL 5.7 的完整流程，涵盖自定义数据目录、外部访问配置及用户权限管理。

</alert>

---

<alert type="error" title="EOL">

MySQL 5.7 已于 **2023 年 10 月 31 日** EOL（停止支持），建议在文章顶部加醒目警示「MySQL 5.7 已停止维护，建议升级到 8.0 LTS 或 8.4 LTS」

</alert>

采用官网 RPM 包安装，版本为 MySQL 5.7 最后一个稳定版。

### 下载解压

打开 MySQL 社区版下载网站：[https://downloads.mysql.com/archives/community](https://downloads.mysql.com/archives/community)

CentOS 是基于红帽的，Select OS Version 选择 Linux 7，如下图

<pic caption="下载MySQL镜像" src="https://oss.olinl.com/centos-all-config/20260627093652_avp0.webp">



</pic>

```bash
# 官网 mysql 5.7 下载地址
https://downloads.mysql.com/archives/get/p/23/file/mysql-5.7.44-1.el7.x86_64.rpm-bundle.tar
```

下载并解压

```bash
# 官网全量包
wget https://downloads.mysql.com/archives/get/p/23/file/mysql-5.7.44-1.el7.x86_64.rpm-bundle.tar

# 解压压缩包
tar -xvf mysql-5.7.44-1.el7.x86_64.rpm-bundle-lite.tar
```

### 安装

```bash
# 按顺序依次安装（顺序不可乱）
rpm -ivh mysql-community-common-5.7*.x86_64.rpm --nodeps --force
rpm -ivh mysql-community-libs-5.7*.x86_64.rpm --nodeps --force
rpm -ivh mysql-community-client-5.7*.x86_64.rpm --nodeps --force
rpm -ivh mysql-community-server-5.7*.x86_64.rpm --nodeps --force

# 查看已安装的 MySQL
rpm -qa | grep mysql
```

### 初始化与启动

#### 1. 默认目录初始化

```bash
# 初始化 MySQL
mysqld --initialize
# 给数据目录权限
chown mysql:mysql /var/lib/mysql -R
# 启动服务
systemctl start mysqld.service
# 设置开机自启
systemctl enable mysqld

# 查看初始密码
cat /var/log/mysqld.log | grep password

# 登录并修改密码
mysql -uroot -p
## 输入上面获取的初始密码，然后执行：
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

#### 2. 自定义数据目录

<warning>

设置自定义目录前，务必禁用 SELinux，否则 MySQL 无法访问自定义路径。

</warning>

以 `/opt/mysql/data` 为例，先修改 `/etc/my.cnf`：

```ini [/etc/my.cnf]
[mysqld]
datadir=/opt/mysql/data
log-error=/opt/mysql/mysqld.log
socket=/opt/mysql/mysql.sock
```

然后执行初始化：

```bash
# 创建数据目录
mkdir -p /opt/mysql/data

# 赋权
chown mysql:mysql /opt/mysql -R

# 使用 mysql 用户初始化
sudo -u mysql mysqld --initialize --datadir=/opt/mysql/data

# 启动服务
systemctl start mysqld.service
systemctl enable mysqld

# 查看初始密码
cat /opt/mysql/mysqld.log | grep password

# 登录并修改密码
mysql -uroot -p
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### 配置外部访问

MySQL 安装后 root 用户默认只允许 localhost 登录，生产环境建议新建专用用户，而非直接开放 root。

**推荐：新建允许外部访问的用户**

```sql
-- 登录 MySQL
mysql -uroot -p

-- 创建允许外部访问的用户
CREATE USER 'root'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

**不推荐：直接修改 root 用户 host**

```sql
mysql -uroot -p

UPDATE mysql.user SET host = '%' WHERE user = 'root';
FLUSH PRIVILEGES;
```

## 十一、CentOS 编译安装 Redis 6.2 并配置 Systemd 服务

<alert>

从源码编译安装 Redis 6.2，配置密码、外部访问与后台运行，并注册为 systemd 服务实现开机自启。

</alert>

---

Redis 版本：6.2.6

通过源码下载本地编译，配置 systemd 服务文件，使用 `systemctl` 进行管理。

### 下载解压

```bash
# 下载 redis
wget https://cdn.olinl.com/redis-6.2.6.tar.gz
# 官方地址
# wget https://download.redis.io/releases/redis-6.2.6.tar.gz

# 解压并移动到 /opt
tar xzf redis-6.2.6.tar.gz
mv redis-6.2.6 /opt/redis
```

### 编译安装

```bash
# 安装编译依赖
yum -y install gcc automake autoconf libtool make

# 进入目录并编译
cd /opt/redis
make MALLOC=libc

# 安装到指定目录
make install PREFIX=/opt/redis

# 验证启动
./bin/redis-server redis.conf
```

### 修改配置文件

编辑 `/opt/redis/redis.conf`：

**设置访问密码**（第 901 行附近）

```bash [/opt/redis/redis.conf]
requirepass your_password
```

**允许外部访问**（第 75 行附近）

<warning>

`bind 0.0.0.0` 会使 Redis 监听所有网络接口，务必配合 `requirepass` 设置强密码，并通过防火墙限制访问来源。

</warning>

```bash [/opt/redis/redis.conf]
bind 0.0.0.0
```

**设置后台运行**（第 257 行附近）

```bash [/opt/redis/redis.conf]
daemonize yes
```

### 注册 Systemd 服务

创建服务文件：

```bash [/etc/systemd/system/redis.service]
[Unit]
Description=redis-server
After=network.target

[Service]
Type=forking
ExecStart=/opt/redis/bin/redis-server /opt/redis/redis.conf
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

服务操作命令：

```bash
# 重载 systemd 配置
systemctl daemon-reload

# 启动
systemctl start redis
# 停止
systemctl stop redis
# 重启
systemctl restart redis
# 查看状态
systemctl status redis
# 开机自启
systemctl enable redis

# 确认进程是否运行
ps -ef | grep redis
```

## 十二、CentOS 安装 Samba 实现跨系统文件共享

<alert>

在 CentOS 上安装 Samba 服务，配置 SMB 共享目录与专用访问用户，实现 Windows 与 Linux 之间的文件互访。

</alert>

---

> Samba 是一个开源软件，实现了 SMB/CIFS 协议，允许在不同操作系统之间共享文件和打印机。

### 安装前准备

<alert type="warning" title="SELinux确认">

Samba 与 SELinux 存在冲突，安装前请确认 SELinux 已关闭。

**直接关闭 SELinux 对生产环境风险较高**

</alert>

```bash
# 查看 SELinux 状态
getenforce

# 临时关闭
setenforce 0

# 永久关闭：编辑配置文件
vim /etc/sysconfig/selinux
# 将 SELINUX=enforcing 改为 SELINUX=disabled
# 修改后需重启系统生效

# 关闭防火墙（或手动开放 139、445 端口）
systemctl stop firewalld.service
systemctl disable firewalld.service
```

### 安装

```bash
yum install -y samba samba-client
```

### 配置共享目录

```bash
# 备份默认配置
mv /etc/samba/smb.conf /etc/samba/smb.conf.bak

# 创建新配置文件
vim /etc/samba/smb.conf
```

在文件中写入以下内容（以共享 `/var/www/html` 为例）：

```ini [/etc/samba/smb.conf]
[global]
    workgroup = WORKGROUP
    security = user

[share]
    comment = Shared Directory
    path = /var/www/html
    browseable = yes
    writable = yes
```

### 创建 Samba 用户

```bash
# 创建系统用户（如已存在可跳过）
useradd smbuser

# 为该用户设置 Samba 密码
smbpasswd -a smbuser
# 按提示输入密码

# 查看已创建的 Samba 用户
pdbedit -L
```

### 启动服务

```bash
# 启动 Samba
systemctl start smb
# 设置开机自启
systemctl enable smb

# 确认服务正在运行
ss -antp | grep smbd
```

### 设置目录权限

```bash
# 给指定用户设置目录的读写执行权限
setfacl -m u:smbuser:rwx /var/www/html
```

通用格式

<copy code="setfacl -m u:<用户名>:rwx /<目录>">



</copy>

## 十三、使用 Squid 为内网服务器搭建 HTTP 代理

<alert>

在有网络的边缘服务器上安装 Squid 代理，让无公网访问的内网机器通过代理完成软件安装与网络请求。

</alert>

---

详见：

<link-card description="在有网络的边缘服务器上安装 Squid 代理，让无公网访问的内网机器通过代理完成软件安装与网络请求。" icon="https://picsum.photos/100/100" link="/2024/squid-proxy" title="使用 Squid 为内网服务器搭建 HTTP 代理">



</link-card>
