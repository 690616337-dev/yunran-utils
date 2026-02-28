from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import uvicorn
import os
import io
import re
import random
import atexit
import shutil
from datetime import datetime, timedelta
from typing import List, Optional
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 图像处理
try:
    from rembg import remove
    from PIL import Image
    REMBG_AVAILABLE = True
except ImportError:
    REMBG_AVAILABLE = False
    logger.warning("rembg or PIL not available, photo tools will be disabled")

# 检查 rembg 模型是否存在
def check_rembg_model():
    """检查 rembg 模型是否已下载"""
    import os
    # rembg 模型通常存储在用户目录下的 .u2net 文件夹
    home_dir = os.path.expanduser('~')
    model_paths = [
        os.path.join(home_dir, '.u2net', 'u2net.onnx'),
        os.path.join(home_dir, '.u2net', 'u2netp.onnx'),
    ]
    
    # 也检查当前工作目录
    model_paths.extend([
        'u2net.onnx',
        'u2netp.onnx',
    ])
    
    for path in model_paths:
        if os.path.exists(path):
            return True, path
    
    return False, None

REMBG_MODEL_AVAILABLE, REMBG_MODEL_PATH = check_rembg_model()
if REMBG_AVAILABLE and not REMBG_MODEL_AVAILABLE:
    logger.warning("rembg model not found, background removal will download model on first use")

# PDF处理
try:
    from pypdf import PdfMerger, PdfReader
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("pypdf not available, PDF tools will be disabled")

# 音频处理
try:
    from pydub import AudioSegment
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    logger.warning("pydub not available, audio tools will be disabled")

# 检查 ffmpeg 是否安装
def check_ffmpeg():
    """检查 ffmpeg 是否已安装"""
    try:
        import subprocess
        result = subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False

FFMPEG_AVAILABLE = check_ffmpeg()
if not FFMPEG_AVAILABLE:
    logger.warning("ffmpeg not found in PATH, audio conversion will not work properly")

app = FastAPI(
    title="云褍实用工具 API",
    description="Electron + React + Python FastAPI 后端服务",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 临时文件目录
TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)
logger.info(f"Temp directory: {TEMP_DIR}")

# 注册临时文件列表，用于清理
temp_files_registry = set()

def register_temp_file(filepath: str):
    """注册临时文件以便清理"""
    temp_files_registry.add(filepath)

def cleanup_temp_file(filepath: str):
    """清理单个临时文件"""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            temp_files_registry.discard(filepath)
            logger.debug(f"Cleaned up temp file: {filepath}")
    except Exception as e:
        logger.error(f"Failed to cleanup temp file {filepath}: {e}")

def cleanup_all_temp_files():
    """清理所有注册的临时文件"""
    logger.info(f"Cleaning up {len(temp_files_registry)} temp files...")
    for filepath in list(temp_files_registry):
        cleanup_temp_file(filepath)
    # 额外清理temp目录中超过1小时的文件
    cleanup_old_temp_files()

def cleanup_old_temp_files(max_age_hours: int = 1):
    """清理超过指定时间的临时文件"""
    try:
        current_time = datetime.now()
        for filename in os.listdir(TEMP_DIR):
            filepath = os.path.join(TEMP_DIR, filename)
            if os.path.isfile(filepath):
                file_time = datetime.fromtimestamp(os.path.getctime(filepath))
                if (current_time - file_time).total_seconds() > max_age_hours * 3600:
                    try:
                        os.remove(filepath)
                        logger.debug(f"Cleaned up old temp file: {filepath}")
                    except Exception as e:
                        logger.error(f"Failed to cleanup old temp file {filepath}: {e}")
    except Exception as e:
        logger.error(f"Error during old temp files cleanup: {e}")

# 注册退出时的清理函数
atexit.register(cleanup_all_temp_files)

# ==================== 身份证工具 API ====================

WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
AREA_CODES = {
    '11': '北京市', '12': '天津市', '13': '河北省', '14': '山西省', '15': '内蒙古自治区',
    '21': '辽宁省', '22': '吉林省', '23': '黑龙江省',
    '31': '上海市', '32': '江苏省', '33': '浙江省', '34': '安徽省', '35': '福建省', '36': '江西省', '37': '山东省',
    '41': '河南省', '42': '湖北省', '43': '湖南省', '44': '广东省', '45': '广西壮族自治区', '46': '海南省',
    '50': '重庆市', '51': '四川省', '52': '贵州省', '53': '云南省', '54': '西藏自治区',
    '61': '陕西省', '62': '甘肃省', '63': '青海省', '64': '宁夏回族自治区', '65': '新疆维吾尔自治区',
    '71': '台湾省', '81': '香港特别行政区', '82': '澳门特别行政区'
}

def calculate_check_code(id17: str) -> str:
    """计算身份证校验码"""
    try:
        sum_val = sum(int(id17[i]) * WEIGHTS[i] for i in range(17))
        return CHECK_CODES[sum_val % 11]
    except (ValueError, IndexError) as e:
        logger.error(f"Error calculating check code: {e}")
        raise ValueError(f"Invalid ID format: {e}")

def validate_id_card(id_card: str) -> dict:
    """验证身份证号码"""
    id_card = id_card.strip().upper()
    
    if len(id_card) != 18:
        return {"valid": False, "message": "身份证号码长度必须为18位"}
    
    if not re.match(r'^\d{17}[\dX]$', id_card):
        return {"valid": False, "message": "身份证号码格式错误"}
    
    # 地区码验证
    area_code = id_card[:2]
    if area_code not in AREA_CODES:
        return {"valid": False, "message": "地区码无效"}
    
    # 出生日期验证
    try:
        year = int(id_card[6:10])
        month = int(id_card[10:12])
        day = int(id_card[12:14])
        birth_date = datetime(year, month, day)
        if birth_date > datetime.now():
            return {"valid": False, "message": "出生日期不能是未来日期"}
        # 检查日期是否有效
        if month < 1 or month > 12 or day < 1 or day > 31:
            return {"valid": False, "message": "出生日期无效"}
    except ValueError as e:
        return {"valid": False, "message": f"出生日期无效: {str(e)}"}
    
    # 校验码验证
    try:
        check_code = calculate_check_code(id_card[:17])
        if check_code != id_card[17]:
            return {"valid": False, "message": f"校验码错误，正确校验码应为: {check_code}"}
    except ValueError as e:
        return {"valid": False, "message": str(e)}
    
    # 性别
    gender_code = int(id_card[16])
    gender = "男" if gender_code % 2 == 1 else "女"
    
    # 年龄
    age = datetime.now().year - year
    
    return {
        "valid": True,
        "message": "身份证号码有效",
        "area": AREA_CODES.get(area_code, "未知"),
        "birthDate": f"{year}-{month:02d}-{day:02d}",
        "gender": gender,
        "age": age,
        "zodiac": get_zodiac(year),
        "constellation": get_constellation(month, day)
    }

def get_zodiac(year: int) -> str:
    """获取生肖"""
    animals = ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊']
    return animals[year % 12]

def get_constellation(month: int, day: int) -> str:
    """获取星座"""
    constellations = [
        (1, 20, "水瓶座"), (2, 19, "双鱼座"), (3, 21, "白羊座"),
        (4, 20, "金牛座"), (5, 21, "双子座"), (6, 22, "巨蟹座"),
        (7, 23, "狮子座"), (8, 23, "处女座"), (9, 23, "天秤座"),
        (10, 24, "天蝎座"), (11, 23, "射手座"), (12, 22, "摩羯座")
    ]
    for m, d, name in constellations:
        if (month == m and day >= d) or (month == (m % 12 + 1) and day < d):
            return name
    return "摩羯座"

def generate_id_card(area_code: str = None, birth_date: str = None, gender: str = None) -> str:
    """生成身份证号码"""
    # 确保 area_code 是 6 位数字（前 2 位省 + 中间 2 位市 + 后 2 位区县）
    if not area_code or len(area_code) < 2:
        # 随机选择一个省级代码，并补充为 6 位
        province_code = random.choice(list(AREA_CODES.keys()))
        # 补充随机市和区县代码
        area_code = province_code + f"{random.randint(1, 20):02d}{random.randint(1, 30):02d}"
    elif len(area_code) == 2:
        # 只有省级代码，补充市和区县
        area_code = area_code + f"{random.randint(1, 20):02d}{random.randint(1, 30):02d}"
    elif len(area_code) < 6:
        # 补足 6 位
        area_code = area_code.ljust(6, '0')
    
    if not birth_date:
        start_date = datetime(1950, 1, 1)
        end_date = datetime(2005, 12, 31)
        days = random.randint(0, (end_date - start_date).days)
        birth_date = (start_date + timedelta(days=days)).strftime("%Y%m%d")
    else:
        birth_date = birth_date.replace("-", "")
        # 确保是 8 位日期格式
        if len(birth_date) != 8:
            birth_date = datetime.now().strftime("%Y%m%d")
    
    # 顺序码 (001-999)
    sequence = random.randint(1, 999)
    if gender == "男":
        if sequence % 2 == 0:
            sequence += 1
    elif gender == "女":
        if sequence % 2 == 1:
            sequence += 1
    
    # 确保顺序码是 3 位数
    id17 = f"{area_code[:6]}{birth_date}{sequence:03d}"
    check_code = calculate_check_code(id17)
    return id17 + check_code

@app.post("/api/idcard/validate")
async def api_validate_id_card(id_card: str = Form(...)):
    """验证身份证号码"""
    try:
        if not id_card or not id_card.strip():
            raise HTTPException(status_code=400, detail="身份证号码不能为空")
        result = validate_id_card(id_card)
        return result
    except Exception as e:
        logger.error(f"Error validating ID card: {e}")
        raise HTTPException(status_code=500, detail=f"验证失败: {str(e)}")

@app.post("/api/idcard/generate")
async def api_generate_id_card(
    area_code: str = Form(None),
    birth_date: str = Form(None),
    gender: str = Form(None),
    count: int = Form(1)
):
    """生成身份证号码"""
    try:
        # 参数验证
        if area_code and area_code not in AREA_CODES:
            raise HTTPException(status_code=400, detail="无效的地区代码")
        if gender and gender not in ["男", "女"]:
            raise HTTPException(status_code=400, detail="性别必须是'男'或'女'")
        if count < 1 or count > 50:
            raise HTTPException(status_code=400, detail="生成数量必须在1-50之间")
        
        count = min(count, 50)  # 最多生成50个
        id_cards = [generate_id_card(area_code, birth_date, gender) for _ in range(count)]
        return {"idCards": id_cards, "count": len(id_cards)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating ID card: {e}")
        raise HTTPException(status_code=500, detail=f"生成失败: {str(e)}")

@app.get("/api/idcard/areas")
async def api_get_areas():
    """获取地区列表"""
    return {"areas": [{"code": k, "name": v} for k, v in AREA_CODES.items()]}

# ==================== PDF合并 API ====================

@app.post("/api/pdf/merge")
async def api_merge_pdf(files: List[UploadFile] = File(...)):
    """合并PDF文件"""
    logger.info(f"PDF merge request received, files count: {len(files)}")
    
    if not PDF_AVAILABLE:
        raise HTTPException(status_code=503, detail="PDF处理功能不可用，请安装pypdf")
    
    if len(files) < 1:
        raise HTTPException(status_code=400, detail="至少需要1个PDF文件")
    
    if len(files) > 50:
        raise HTTPException(status_code=400, detail="最多支持50个PDF文件")
    
    merger = PdfMerger()
    temp_files = []
    output_path = None
    
    try:
        for idx, file in enumerate(files):
            logger.info(f"Processing file {idx}: {file.filename}")
            
            if not file.filename:
                logger.warning(f"File {idx} has no filename, skipping")
                continue
            if not file.filename.lower().endswith('.pdf'):
                logger.warning(f"File {file.filename} is not a PDF, skipping")
                continue
            
            # 读取文件内容
            try:
                content = await file.read()
                logger.info(f"File {file.filename} size: {len(content)} bytes")
            except Exception as e:
                logger.error(f"Error reading file {file.filename}: {e}")
                raise HTTPException(status_code=400, detail=f"读取文件失败: {file.filename}")
            
            # 限制单个文件大小 (50MB)
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"文件 {file.filename} 超过50MB限制")
            
            # 保存临时文件
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            temp_filename = f"temp_{timestamp}_{idx}_{file.filename}"
            temp_path = os.path.join(TEMP_DIR, temp_filename)
            
            try:
                with open(temp_path, "wb") as f:
                    f.write(content)
                temp_files.append(temp_path)
                register_temp_file(temp_path)
                logger.info(f"Saved temp file: {temp_path}")
            except Exception as e:
                logger.error(f"Error saving temp file {temp_path}: {e}")
                raise HTTPException(status_code=500, detail=f"保存文件失败: {file.filename}")
            
            # 添加到 merger
            try:
                merger.append(temp_path)
                logger.info(f"Added {file.filename} to merger")
            except Exception as e:
                logger.error(f"Error adding {file.filename} to merger: {e}")
                raise HTTPException(status_code=400, detail=f"无效的PDF文件: {file.filename}")
        
        if len(temp_files) == 0:
            raise HTTPException(status_code=400, detail="没有有效的PDF文件")
        
        # 生成输出文件
        output_filename = f"merged_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        output_path = os.path.join(TEMP_DIR, output_filename)
        
        try:
            merger.write(output_path)
            merger.close()
            register_temp_file(output_path)
            logger.info(f"Merged PDF saved to: {output_path}")
        except Exception as e:
            logger.error(f"Error writing merged PDF: {e}")
            raise HTTPException(status_code=500, detail=f"合并PDF失败: {str(e)}")
        
        # 读取文件并返回
        try:
            with open(output_path, "rb") as f:
                file_content = f.read()
            logger.info(f"Returning merged PDF, size: {len(file_content)} bytes")
        except Exception as e:
            logger.error(f"Error reading merged PDF: {e}")
            raise HTTPException(status_code=500, detail="读取合并后的文件失败")
        
        # 清理临时文件
        for temp_file in temp_files:
            cleanup_temp_file(temp_file)
        cleanup_temp_file(output_path)
        
        return StreamingResponse(
            io.BytesIO(file_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=merged.pdf"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error merging PDF: {e}")
        # 清理临时文件
        for temp_file in temp_files:
            cleanup_temp_file(temp_file)
        if output_path:
            cleanup_temp_file(output_path)
        raise HTTPException(status_code=500, detail=f"合并失败: {str(e)}")

# ==================== 证件照抠图 API ====================

@app.post("/api/photo/remove-bg")
async def api_remove_background(file: UploadFile = File(...)):
    """移除图片背景"""
    if not REMBG_AVAILABLE:
        raise HTTPException(status_code=503, detail="图像处理功能不可用，请安装rembg和Pillow")
    
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="未选择文件")
        
        # 检查文件类型
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        file_ext = os.path.splitext(file.filename.lower())[1]
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"不支持的文件格式: {file_ext}")
        
        image_data = await file.read()
        
        # 限制文件大小 (20MB)
        if len(image_data) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件大小超过20MB限制")
        
        input_image = Image.open(io.BytesIO(image_data))
        
        # 转换为RGBA模式
        if input_image.mode != 'RGBA':
            input_image = input_image.convert('RGBA')
        
        # 使用rembg移除背景
        output_image = remove(input_image)
        
        # 保存到内存
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="PNG")
        output_buffer.seek(0)
        
        return StreamingResponse(output_buffer, media_type="image/png")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing background: {e}")
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

@app.post("/api/photo/change-bg")
async def api_change_background(
    file: UploadFile = File(...),
    color: str = Form("#ffffff")
):
    """更换证件照背景色"""
    if not REMBG_AVAILABLE:
        raise HTTPException(status_code=503, detail="图像处理功能不可用，请安装rembg和Pillow")
    
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="未选择文件")
        
        # 检查文件类型
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        file_ext = os.path.splitext(file.filename.lower())[1]
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"不支持的文件格式: {file_ext}")
        
        image_data = await file.read()
        
        # 限制文件大小 (20MB)
        if len(image_data) > 20 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件大小超过20MB限制")
        
        input_image = Image.open(io.BytesIO(image_data))
        
        # 确保是RGBA模式
        if input_image.mode != 'RGBA':
            input_image = input_image.convert('RGBA')
        
        # 解析颜色
        color = color.lstrip('#')
        if len(color) == 3:
            color = ''.join([c*2 for c in color])
        if not re.match(r'^[0-9A-Fa-f]{6}$', color):
            raise HTTPException(status_code=400, detail="无效的颜色格式")
        
        rgb = tuple(int(color[i:i+2], 16) for i in (0, 2, 4))
        
        # 创建背景色图层
        background = Image.new('RGBA', input_image.size, rgb + (255,))
        
        # 合并
        background.paste(input_image, (0, 0), input_image)
        
        # 转换为RGB并保存
        final_image = background.convert('RGB')
        
        output_buffer = io.BytesIO()
        final_image.save(output_buffer, format="JPEG", quality=95)
        output_buffer.seek(0)
        
        return StreamingResponse(output_buffer, media_type="image/jpeg")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing background: {e}")
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

# ==================== 音频转换 API ====================

@app.post("/api/audio/convert")
async def api_convert_audio(
    file: UploadFile = File(...),
    format: str = Form("mp3"),
    bitrate: str = Form("192k")
):
    """转换音频格式"""
    if not AUDIO_AVAILABLE:
        raise HTTPException(status_code=503, detail="音频处理功能不可用，请安装pydub")
    
    if not FFMPEG_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="ffmpeg未安装，无法进行音频转换。请安装ffmpeg: https://ffmpeg.org/download.html"
        )
    
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="未选择文件")
        
        # 检查输出格式
        allowed_formats = {'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'}
        format_lower = format.lower()
        if format_lower not in allowed_formats:
            raise HTTPException(status_code=400, detail=f"不支持的输出格式: {format}")
        
        input_data = await file.read()
        
        # 限制文件大小 (100MB)
        if len(input_data) > 100 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件大小超过100MB限制")
        
        input_buffer = io.BytesIO(input_data)
        
        # 检测输入格式
        input_format = file.filename.split('.')[-1].lower()
        
        # 处理特殊格式
        format_mapping = {
            'mp3': 'mp3',
            'wav': 'wav',
            'aac': 'aac',
            'flac': 'flac',
            'ogg': 'ogg',
            'm4a': 'mp4',
            'wma': 'asf',
        }
        
        pydub_format = format_mapping.get(input_format, input_format)
        
        # 使用pydub加载音频
        audio = AudioSegment.from_file(input_buffer, format=pydub_format)
        
        # 导出为指定格式
        output_buffer = io.BytesIO()
        
        # 设置导出参数
        export_params = {"format": format}
        if format_lower in ['mp3', 'ogg']:
            export_params["bitrate"] = bitrate
        
        audio.export(output_buffer, **export_params)
        output_buffer.seek(0)
        
        output_filename = f"converted.{format}"
        mime_types = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
            'ogg': 'audio/ogg',
            'm4a': 'audio/mp4',
            'wma': 'audio/x-ms-wma',
        }
        
        return StreamingResponse(
            output_buffer,
            media_type=mime_types.get(format_lower, 'audio/mpeg'),
            headers={"Content-Disposition": f"attachment; filename={output_filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error converting audio: {e}")
        raise HTTPException(status_code=500, detail=f"转换失败: {str(e)}")

# ==================== 视频转换 API（预留）====================

@app.post("/api/video/convert")
async def api_convert_video(
    file: UploadFile = File(...),
    format: str = Form("mp4"),
    resolution: str = Form("original")
):
    """转换视频格式（预留）"""
    raise HTTPException(status_code=501, detail="视频转换功能正在开发中，敬请期待！")

@app.get("/api/video/status")
async def api_video_status():
    """获取视频转换功能状态"""
    return {
        "status": "development",
        "message": "视频转换功能正在开发中",
        "supported_formats": ["mp4", "avi", "mkv", "mov", "wmv"],
        "supported_resolutions": ["original", "720p", "1080p", "4k"]
    }

# ==================== 系统 API ====================

@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "ok",
        "version": "1.0.0",
        "features": {
            "pdf": PDF_AVAILABLE,
            "photo": REMBG_AVAILABLE,
            "audio": AUDIO_AVAILABLE,
            "video": False
        }
    }

@app.get("/api/status")
async def api_status():
    """获取服务状态"""
    return {
        "status": "running",
        "version": "1.0.0",
        "temp_dir": TEMP_DIR,
        "temp_files_count": len(temp_files_registry),
        "features": {
            "idcard": True,
            "pdf": PDF_AVAILABLE,
            "photo": REMBG_AVAILABLE,
            "audio": AUDIO_AVAILABLE,
            "video": False
        },
        "dependencies": {
            "ffmpeg": {
                "available": FFMPEG_AVAILABLE,
                "message": "已安装" if FFMPEG_AVAILABLE else "未安装，音频转换功能需要 ffmpeg"
            },
            "rembg_model": {
                "available": REMBG_MODEL_AVAILABLE,
                "path": REMBG_MODEL_PATH,
                "message": "模型已下载" if REMBG_MODEL_AVAILABLE else "模型未下载，首次使用时会自动下载"
            }
        }
    }

@app.post("/api/cleanup")
async def api_cleanup():
    """手动触发临时文件清理"""
    try:
        cleanup_all_temp_files()
        return {"status": "ok", "message": "临时文件已清理"}
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise HTTPException(status_code=500, detail=f"清理失败: {str(e)}")

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "云褍实用工具 API 服务运行中",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
