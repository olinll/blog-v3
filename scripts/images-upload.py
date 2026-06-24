#!/usr/bin/env python3
"""
图片转 WebP 并上传到云存储 —— 长期监听脚本
=============================================
支持 Cloudflare R2 / 阿里云 OSS，通过 .env 配置，启动时选择目标。

用法:
    python scripts/images-upload.py          # 交互选择 r2/oss
    python scripts/images-upload.py r2       # 直接上传到 R2
    python scripts/images-upload.py oss      # 直接上传到 OSS
    Ctrl+C 或输入 q 退出。

依赖:
    pip install boto3 oss2 Pillow
"""

import os
import sys
import shlex
import random
import string
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path

# ---- 兼容 Windows GBK 终端 ----
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# ============================================================
# 加载 .env
# ============================================================

def _load_dotenv(path: str) -> dict[str, str]:
    """简陋 .env 解析器 —— 不需要 python-dotenv 依赖。
    规则: 忽略空行和 # 注释，支持 KEY=VALUE 和 KEY="VALUE"。"""
    env = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                k, _, v = line.partition("=")
                k, v = k.strip(), v.strip()
                # 去掉引号包裹
                if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
                    v = v[1:-1]
                env[k] = v
    except FileNotFoundError:
        pass
    return env


def _env_or(k: str, default: str) -> str:
    return os.environ.get(k, default)


# 项目根目录（脚本在 scripts/ 下，.env 在上层）
PROJECT_DIR = Path(__file__).resolve().parent.parent

for k, v in _load_dotenv(str(PROJECT_DIR / ".env")).items():
    os.environ.setdefault(k, v)

# ============================================================
# 通用配置
# ============================================================

OUTPUT_FORMAT = _env_or("OUTPUT_FORMAT", "pic")  # "md" 或 "pic"
WEBP_QUALITY  = int(_env_or("WEBP_QUALITY", "100"))
WEBP_METHOD   = int(_env_or("WEBP_METHOD", "6"))

# ============================================================
# 目标选择
# ============================================================

TARGETS = {
    "r2": {
        "label": "Cloudflare R2",
        "env_prefix": "R2_",
        "required": ("ACCOUNT_ID", "ACCESS_KEY", "SECRET_KEY", "BUCKET"),
    },
    "oss": {
        "label": "阿里云 OSS",
        "env_prefix": "OSS_",
        "required": ("ACCESS_KEY_ID", "ACCESS_KEY_SECRET", "ENDPOINT", "BUCKET"),
    },
}


def get_target_config(target: str) -> dict:
    """根据目标 key 返回 { label, access_key_id, access_key_secret, endpoint, bucket, public_domain, upload_prefix }"""
    meta = TARGETS[target]
    p = meta["env_prefix"]

    if target == "r2":
        cfg = {
            "label": meta["label"],
            "account_id":     _env_or(p + "ACCOUNT_ID", ""),
            "access_key":     _env_or(p + "ACCESS_KEY", ""),
            "secret_key":     _env_or(p + "SECRET_KEY", ""),
            "bucket":         _env_or(p + "BUCKET", ""),
            "public_domain":  _env_or(p + "PUBLIC_DOMAIN", ""),
            "upload_prefix":  _env_or(p + "UPLOAD_PREFIX", ""),
        }
        # 校验
        missing = [p + k for k in meta["required"] if not cfg.get(k.lower())]
    else:
        cfg = {
            "label": meta["label"],
            "access_key_id":     _env_or(p + "ACCESS_KEY_ID", ""),
            "access_key_secret": _env_or(p + "ACCESS_KEY_SECRET", ""),
            "endpoint":          _env_or(p + "ENDPOINT", ""),
            "bucket":            _env_or(p + "BUCKET", ""),
            "public_domain":     _env_or(p + "PUBLIC_DOMAIN", ""),
            "upload_prefix":     _env_or(p + "UPLOAD_PREFIX", ""),
        }
        missing = [p + k for k in meta["required"] if not cfg.get(k.lower())]

    if missing:
        required_envs = [p + k for k in missing]
        print(f"[{target.upper()}] 缺少必填配置: {', '.join(required_envs)}")
        print("请检查项目根目录的 .env 文件")
        sys.exit(1)

    return cfg


# ============================================================
# 依赖检查
# ============================================================

missing = []
try:
    import boto3
    from botocore.config import Config as BotoConfig
except ImportError:
    missing.append("boto3")

try:
    import oss2
except ImportError:
    missing.append("oss2")

try:
    from PIL import Image
except ImportError:
    missing.append("Pillow")

if missing:
    print(f"缺少依赖: {', '.join(missing)}")
    print(f"请运行: pip install {' '.join(missing)}")
    sys.exit(1)

# ============================================================
# 上传客户端（懒加载）
# ============================================================

_r2_client = None
_oss_bucket = None


def _get_r2(cfg: dict):
    global _r2_client
    if _r2_client is None:
        endpoint = f"https://{cfg['account_id']}.r2.cloudflarestorage.com"
        _r2_client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=cfg["access_key"],
            aws_secret_access_key=cfg["secret_key"],
            config=BotoConfig(
                region_name="auto",
                s3={"addressing_style": "path"},
            ),
        )
    return _r2_client


def _get_oss(cfg: dict):
    global _oss_bucket
    if _oss_bucket is None:
        auth = oss2.Auth(cfg["access_key_id"], cfg["access_key_secret"])
        _oss_bucket = oss2.Bucket(auth, cfg["endpoint"], cfg["bucket"])
    return _oss_bucket


def upload_file(local: str, filename: str, slug: str, target: str, cfg: dict) -> str:
    """上传到指定目标，返回公开 URL"""
    parts = [p for p in (cfg["upload_prefix"], slug, filename) if p]
    key = "/".join(parts)

    if target == "r2":
        _get_r2(cfg).upload_file(local, cfg["bucket"], key, ExtraArgs={"ContentType": "image/webp"})
    else:
        headers = {"Content-Type": "image/webp"}
        _get_oss(cfg).put_object_from_file(key, local, headers=headers)

    return f"{cfg['public_domain']}/{key}"


# ============================================================
# 工具函数
# ============================================================

SUPPORTED_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".tif", ".webp", ".ico"}
_ALPHANUM = string.ascii_lowercase + string.digits
_SUFFIX_LEN = 4


def human_size(n: int) -> str:
    for u in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {u}"
        n /= 1024
    return f"{n:.1f} TB"


def _random_suffix() -> str:
    return "".join(random.choices(_ALPHANUM, k=_SUFFIX_LEN))


def convert_to_webp(src: str, dest_dir: str, custom_name: str = "") -> tuple[str, int]:
    """图片转 WebP，返回 (输出路径, 文件大小)。
    custom_name 为空时自动生成 YYYYMMDDHHmmss_XXXX.webp 名称。"""
    img = Image.open(src)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    if custom_name:
        stem = custom_name
    else:
        stem = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{_random_suffix()}"
    out = os.path.join(dest_dir, f"{stem}.webp")
    img.save(out, "webp", quality=WEBP_QUALITY, method=WEBP_METHOD)
    size = os.path.getsize(out)
    return out, size


def parse_paths(text: str) -> list[str]:
    """解析用户粘贴的路径，正确处理引号包裹的带空格路径。
    posix=False 保证 Windows 反斜杠不被当成转义符吃掉。"""
    try:
        return [p for p in shlex.split(text, posix=False) if p]
    except ValueError:
        return [p for p in text.split() if p]


def format_output(url: str) -> str:
    """根据 OUTPUT_FORMAT 模板格式化"""
    if OUTPUT_FORMAT == "pic":
        return f"::pic\n---\nsrc: {url}\ncaption: \n---\n::"
    else:  # "md"
        return f"![]({url})"


def copy_to_clipboard(text: str):
    """复制到系统剪贴板"""
    if sys.platform == "win32":
        subprocess.run("clip", input=text, shell=True, text=True)
    elif sys.platform == "darwin":
        subprocess.run("pbcopy", input=text, text=True)
    else:
        try:
            subprocess.run(["wl-copy"], input=text, text=True)
        except FileNotFoundError:
            subprocess.run(["xclip", "-selection", "clipboard"], input=text, text=True)


# ============================================================
# 主循环
# ============================================================

def choose_target() -> str:
    """选择上传目标，返回 'r2' 或 'oss'"""
    # 命令行参数直接指定
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in TARGETS:
            return arg
        print(f"未知目标: {arg}，可选: {', '.join(TARGETS)}")
        sys.exit(1)

    # 交互选择
    options = list(TARGETS.items())
    while True:
        print("选择上传目标:")
        for i, (key, meta) in enumerate(options, 1):
            print(f"  {i}. {meta['label']} ({key})")
        try:
            choice = input("> ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("\n已取消")
            sys.exit(0)
        if choice in TARGETS:
            return choice
        # 也支持数字选择
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(options):
                return options[idx][0]
        except ValueError:
            pass
        print("  输入 r2 / oss 或数字")


def main():
    target = choose_target()
    cfg = get_target_config(target)

    # --- 启动时输入 slug ---
    slug = ""
    while not slug:
        try:
            slug = input("slug 名称: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n已取消")
            return
        if not slug:
            print("  slug 不能为空，重新输入")

    # --- 是否自定义图片名称 ---
    custom = False
    while True:
        try:
            ans = input("是否自定义图片名称？(y/n): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("\n已取消")
            return
        if ans in ("y", "yes"):
            custom = True
            break
        elif ans in ("n", "no"):
            custom = False
            break
        print("  输入 y 或 n")

    # --- 开始监听 ---
    upload_path = "/".join(p for p in (cfg["public_domain"], cfg["upload_prefix"], slug) if p)
    print()
    print("=" * 55)
    print(f"  图片 → WebP → {cfg['label']}")
    print(f"  slug: {slug}    自定义名称: {'是' if custom else '否'}")
    print(f"  模板: {OUTPUT_FORMAT}    上传路径: {upload_path}/")
    print(f"  质量: {WEBP_QUALITY}")
    print("-" * 55)
    print("  粘贴图片路径，回车处理")
    print("  输入 q 退出，Ctrl+C 也可退出")
    print("=" * 55)

    while True:
        try:
            line = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n已退出")
            break

        if not line:
            continue
        if line.lower() in ("q", "quit", "exit"):
            print("已退出")
            break

        paths = parse_paths(line)
        if not paths:
            continue

        for raw in paths:
            p = Path(raw)
            src = str(p.resolve())

            if not p.is_file():
                print(f"  × 不存在: {raw}")
                continue

            ext = p.suffix.lower()
            if ext not in SUPPORTED_EXTS:
                print(f"  × 不支持 {ext}: {p.name}")
                continue

            # 自定义名称（留空自动生成 YYYYMMDDHHmmss_XXXX）
            custom_name = ""
            if custom:
                try:
                    name = input(f"  图片名称（留空自动生成）: ").strip()
                except (EOFError, KeyboardInterrupt):
                    print("\n已退出")
                    return
                if name:
                    custom_name = name

            try:
                with tempfile.TemporaryDirectory(prefix="w2u_") as td:
                    wp, ws = convert_to_webp(src, td, custom_name)
                    wp_name = os.path.basename(wp)
                    print(f"  转 {p.name} → {wp_name} ({human_size(ws)})")
                    url = upload_file(wp, wp_name, slug, target, cfg)
                    print(f"  ✓ {url}")

                    # 格式化并复制到剪贴板
                    formatted = format_output(url)
                    copy_to_clipboard(formatted)
                    print(f"  📋 已复制 ({OUTPUT_FORMAT}):")
                    print(f"  {formatted}")
            except Exception as e:
                print(f"  × 失败 {p.name}: {e}")


if __name__ == "__main__":
    main()
