# TourismPlanning

一个适合随时 vibe coding 的旅游计划项目库。每次旅行都是一个独立的文件夹：让 AI 根据你的需求完善路线、图片、美食和住处，确认后构建为静态站点，放到自己的服务器，把计划链接发给朋友。

已有示例：**成都 2026.11.11—11.15 四人冒险手册**，保留二次元视觉、动画、详细景区路线、实景照片、平价民宿和百度地图搜索入口。

## 1. 本地启动

需要 **Node.js 22 或更新版本**，无第三方 npm 依赖，无需 `npm install`。

```bash
cd '/Users/wanghaoran/Git Libraries/TourismPlanning'
npm run dev
```

打开终端输出的 `http://127.0.0.1:5173`。首页是计划库，点击卡片进入具体旅行。

开发模式包含草稿，监听 `plans/`、`public/`；修改后自动重新构建，**浏览器需要手动刷新**。端口占用时：

```bash
PORT=5174 npm run dev
```

验收生产产物：

```bash
npm run check
npm run preview
```

`preview` 只服务已有 `dist/`，不监听修改。`dist/` 可部署到普通静态托管；计划库需要通过 HTTP 访问，不直接双击首页 HTML。

## 2. 每次旅行，开一个新项目

### 从空模板开始

```bash
npm run plan:create -- \
  --slug hangzhou-2027-04 \
  --title '杭州春日三天游' \
  --destination 杭州 \
  --start 2027-04-02 \
  --end 2027-04-04 \
  --travelers 4
```

生成 `plans/hangzhou-2027-04/`，默认 `status: "draft"`。`slug` 只接受小写英文、数字和单个连字符；已存在的目录不会覆盖。

### 沿用一份喜欢的设计

```bash
npm run plan:create -- \
  --slug chongqing-2027-05 \
  --title '重庆山城漫游' \
  --destination 重庆 \
  --start 2027-05-10 \
  --end 2027-05-13 \
  --travelers 4 \
  --from chengdu-2026-11-11
```

复制页面、素材和资料笔记，建立新的草稿。**复制仅更新目录元数据，不会自动改写原页面中的成都日期、地点、正文和引用**。继续让 AI 将它完整改造成新旅行，再验收。

### 给 Codex / 其他 coding agent 的示例指令

> 阅读 product.md、AGENTS.md 与 plans/hangzhou-2027-04/notes/brief.md。只改这份杭州计划。我们四人，预算每人 1500 元，喜欢园林、茶馆和小吃；请先查官方开放信息，再设计三天路线，补充实景图、具体店铺和两卧民宿。风格做成动画旅行手账。图片保存到 assets/，保留资料链接，验证手机宽度与交互，完成后保持 draft，等我确认。

建议先在 `notes/brief.md` 写好抵离时间、预算、饮食偏好、床位需求、必去点、特殊活动及风格参考。每份旅行可以独立选择 HTML/CSS/JS 和视觉方向，不被同一模板锁住。

### 确认后加入发布产物

将该计划 `plan.json` 中的 `status` 改为 `ready`，运行：

```bash
npm run check
```

生产构建只包含 `ready` 计划，`draft` 不会出现在目录 JSON 或输出页面里。`notes/`、`plan.json` 和计划内 `README.md` 不会被复制到 `dist/`。这是一套构建规则，**不是访问权限系统**：凡进入产物的页面及素材，部署后都可被访问。

## 3. 项目结构与字段

```text
public/                         # 计划库首页、搜索与城市筛选
plans/
  chengdu-2026-11-11/
    plan.json                   # 元数据；首页自动汇总
    index.html                  # 这一份旅行的完整页面
    assets/                     # 照片、插画、字体；全部本地化
    notes/brief.md              # 需求/研究笔记，不发布
  <new-trip>/
    index.html, style.css, plan.js, assets/, notes/
templates/plan/                 # 新计划起始模板
scripts/                        # 创建、校验、构建、本地服务
docker/                         # Nginx 与可选 Caddy 配置
compose.yaml                    # HTTP 部署
compose.https.yaml              # 可选域名 HTTPS
product.md                      # 产品定位、工作流与范围
AGENTS.md                       # 后续 vibe coding 的约定
dist/                           # 自动生成，不提交
```

`plan.json`：

```json
{
  "slug": "hangzhou-2027-04",
  "title": "杭州春日三天游",
  "destination": "杭州",
  "summary": "四个人的园林、茶馆与湖边漫游。",
  "startDate": "2027-04-02",
  "endDate": "2027-04-04",
  "travelers": 4,
  "status": "draft",
  "tags": ["园林", "茶馆"],
  "cover": "assets/cover.svg"
}
```

封面必须是该计划 `assets/` 内真实存在的文件。主页使用元数据；**旅行详情正文由其页面管理**，更改元数据不会同步改写任意自定义页面。页面素材使用相对路径，例如 `./assets/photo.jpg`；返回首页用 `../../`。不要写本机绝对路径。当前按域名根目录部署，子路径部署需自行调整首页及反代规则。

## 4. 服务器 Docker 部署

需要服务器已有 Docker Engine 与 Compose v2、可拉取 Docker Hub 镜像；无需安装 Node、npm 或数据库。支持基础镜像提供的 amd64/arm64 架构，镜像在目标服务器上构建。

首次部署前，先在本地将本项目文件提交并推送到已创建的 GitHub 仓库（以下操作由你执行）：

```bash
git add .
git commit -m "Build portable travel planning system"
git push origin HEAD
```

然后在服务器执行：

```bash
git clone https://github.com/messywind/TourismPlanning.git
cd TourismPlanning
cp .env.example .env
# 可选：编辑 .env 修改 PORT / BIND_ADDRESS / IMAGE_TAG
docker compose config --quiet
docker compose up -d --build
```

访问 `http://服务器IP:8080`。直接分享具体计划：

```text
http://服务器IP:8080/plans/chengdu-2026-11-11/
```

服务器或云安全组需允许你选择的端口。仓库若为私有，请使用你已有的 GitHub SSH/凭据访问，不把 token 写进命令或仓库。

运行结构：Node 构建阶段校验并导出 → Nginx 运行阶段仅提供静态文件。容器以 UID 101 运行，内容只读；临时文件写 `/tmp`，Compose 已提供 tmpfs。没有数据库、上传目录或运行时内容卷；计划源文件以 Git 仓库为准。图片/字体随镜像打包，无需地图 API 密钥。

### 容器验收

```bash
docker compose ps
docker compose logs --tail=100 tourism
curl --fail http://127.0.0.1:8080/healthz
curl --fail http://127.0.0.1:8080/plans.json
curl --fail -I http://127.0.0.1:8080/plans/chengdu-2026-11-11/
```

`healthz` 应输出 `ok`，容器稍后应为 `healthy`；首页、图片、日期切换、动效开关和计划直链再用浏览器确认。若改了端口，替换上述 8080。

### 新内容上线与版本回退

将改好的文件提交并推送到 GitHub 后，服务器执行：

```bash
git pull --ff-only
docker compose up -d --build
```

此项目没有自动部署；`.github/workflows/check.yml` 只做检查和容器冒烟测试，不连接服务器。修改源文件后必须重新构建镜像，容器不会直接读取仓库的新内容。

需要保留回退版本时，每次部署前设置独立标签：

```bash
IMAGE_TAG=release-2026-11-06 docker compose up -d --build
# 下次部署用新标签；旧镜像保留在服务器
IMAGE_TAG=release-2026-11-07 docker compose up -d --build
# 回退到已存在的旧标签，不重新构建
IMAGE_TAG=release-2026-11-06 docker compose up -d --no-build
```

不要在确认新版本前清理旧镜像。也可检出旧 Git 提交重建。停用服务：`docker compose down`；源文件仍在仓库。

## 5. 域名 + 自动 HTTPS（可选）

已准备 Caddy，自动申请证书。先把域名的 A/AAAA 记录指向服务器，开放 80/443，确认未被其他服务占用。

在 `.env` 中设置：

```dotenv
BIND_ADDRESS=127.0.0.1
PORT=8080
IMAGE_TAG=local
DOMAIN=travel.example.com
```

启动两项服务：

```bash
docker compose -f compose.yaml -f compose.https.yaml config --quiet
docker compose -f compose.yaml -f compose.https.yaml up -d --build
docker compose -f compose.yaml -f compose.https.yaml logs --tail=100 caddy
```

访问 `https://travel.example.com`，把计划直链发给朋友。Caddy 与 Nginx 通过容器网络通信，8080 仅监听宿主机回环；证书数据由 `caddy_data` 卷保存。后续更新和停用也使用同样两个 `-f` 参数；不要随意删除证书卷。已有反向代理时，只需代理到宿主机 `127.0.0.1:8080`。

## 6. 验证、边界与排障

```bash
npm test           # 元数据、草稿隔离、创建/复制、路径、失败构建、HTTP 行为
npm run build      # 输出 ready 计划并生成首页目录
npm run check      # 完整本地检查
```

- 首页没有计划：检查 `status`，生产构建不包含草稿。
- 新目录创建失败：检查必填参数、slug、真实日期与目录是否已存在。
- 页面旧了：重新构建并重启容器；浏览器刷新。开发模式修改后也需刷新。
- 图片 404：使用相对路径，把素材实际放入该计划目录。构建会检查封面，其他动态引用还要浏览器验收。
- 分享链接 404：确认该计划为 `ready`，路径以 `/plans/<slug>/` 结尾，容器已更新。
- 端口占用：修改 `.env` 中 `PORT`。
- HTTPS 失败：检查 DNS、公网 80/443、防火墙及 Caddy 日志。
- 不要把旧草稿、订单、证件或密钥放进公开的 `assets/`；构建发布整个计划页面和素材，不做文件级隐私识别。

当前版本不包含网页后台、账号权限、多人实时编辑、在线下单、实时地图导航或服务器上传。浏览器负责查看计划；创建与修改在本地/IDE 完成。单独发链接不等于私密访问，需要私密分享时应另接身份验证代理。

Docker 参考：[Nginx unprivileged 镜像](https://github.com/nginx/docker-nginx-unprivileged)、[Compose 环境变量](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)。基础镜像使用可更新版本标签；有可复现构建要求时，在完成服务器验收后固定镜像 digest。

首次交付环境未安装 Docker，因此本地未执行容器构建/启动。仓库已提供与生产配置一致的 GitHub Actions 容器冒烟流程，推送后查看 Actions 结果，并按上文在服务器验收。
