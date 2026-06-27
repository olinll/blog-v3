# 利用EdgeOne Pages给飞牛容器一个固定域名

> 使用飞牛的Connect服务，提供的临时域名动态反代到EdgeOnePages，为容器提供一个固定域名。

<alert type="error">

此教程编写于2025年11月份，部分功能可能无法使用！

</alert>

## 写在前面

其原因是看到一个仓库[myflavor/edge-ug-docker](https://github.com/myflavor/edge-ug-docker)

该仓库是利用Edge Pages反代绿联的docker代理，实现使用自己的域名直接访问docker端口

那么飞牛的同理，我们也可以使用飞牛的FN Connect服务，为自己的Docker容器端口绑定一个自己的域名，实现上述操作。

<alert>

飞牛API参考仓库：[FNOSP/fnnas-api](https://github.com/FNOSP/fnnas-api)

</alert>

<alert type="info">

由于飞牛的API使用的是websocket，所以需要一个api服务对外提供查询服务，随后使用一个前端服务对API返回的url地址进行反代。

API项目：[olinll/edge-fn-docker-api](https://github.com/olinll/edge-fn-docker-api)

前端反代项目：[olinll/edge-fn-docker](https://github.com/olinll/edge-fn-docker)

</alert>

## 部署

<alert type="warning">

这里事先声明，API只需要部署一套，反代服务可以部署多套<br />


例：需要反代 5432、8080、9001，那么你就部署3个反代服务，分别配置不同的环境变量即可！

</alert>

首先Fork我的两个项目，打开腾讯EdgeOne Pages页面，部署API服务

## API服务

选择main分支，构建设置默认即可，配置环境变量`GLOBAL_AUTH_KEY` 为一个随机值，用于后续访问的鉴权密钥。

<pic caption="部署项目" src="https://oss.olinl.com/edgeone-fndocker/20260627152625_6q90.webp">



</pic>

点击开始部署，然后添加一个**自定义域名并且配置HTTPS**

<alert type="info">

PS：配置eo提供的域名需要token访问且只能维持3小时，所以这里需要使用自定义的域名。<br />


添加域名的方法可参考腾讯云配置，这里不做太多赘述。<br />


eo控制台->添加域名-> 根据选择的方式进行验证域名-> 配置pages自定义域名-> 去域名托管商配置上生成的cname记录-> 配置https -> 等待生效

</alert>

Pages主界面显示运行中，**API服务**部署完成，下面开始部署反代页面

<pic caption="部署完成" src="https://oss.olinl.com/edgeone-fndocker/20260627152704_2kwq.webp">



</pic>

## 反代服务

首先创建项目，选择你fork的edge-fn-docker仓库，生产分支main<br />


然后配置环境变量（可以直接复制进去填写变量值）

```sql
FN_ID=           // 你的FNID
FN_USERNAME=  // 你的飞牛NAS登录名
FN_PASSWORD=  // 你的飞牛NAS登录密码
FN_PORT=          // 目标服务的端口号
FN_KEY=          // API服务的GLOBAL_AUTH_KEY
FN_API=          // API服务配置的域名
```

<alert type="warning">

这里一定要在飞牛创建一个管理员用户去使用，一定不要使用默认的管理员用户。

**！！！以防一些未知问题导致用户密码错误次数过多被封禁！！！**

**！！！以防一些未知问题！！！**

</alert>

最终配置如图

<pic caption="环境变量配置" src="https://oss.olinl.com/edgeone-fndocker/20260627152755_p05o.webp">



</pic>

点击开始部署，等待部署完成，使用上面的方式绑定自己的自定义域名。<br />

**创建KV存储**<br />


1、点击pages下面的KV存储，创建一个命名空间，这里可以随便命名<br />


2、找到你的反代服务(就是edge-fn-docker)，点击KV存储，绑定命名空间，变量名称填写`nas`，绑定上面创建的命名空间。<br />


创建完成如图所示

<pic caption="配置KV存储" src="https://oss.olinl.com/edgeone-fndocker/20260627152822_n2ew.webp">



</pic>

最后，打开你绑定的服务域名，即可访问飞牛NAS上的服务。

## 写在最后

如果出现访问出错，请检查上述配置是否正确，填写的环境变量是否出错！<br />


如果配置无误，请检查你的FN Connect服务是否能正常打开，如无法打开，请登录飞牛，开关FN Connect开关进行重启服务。<br />

*其他问题请联系作者。*<br />

**免责声明**<br />


如果此仓库违反了飞牛私有云用户协议，请联系我此篇文章和相关仓库。
