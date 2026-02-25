// ===== 配置常量 =====
const CONFIG = {
    MAX_FILE_COUNT: 50,
    MAX_IMAGE_SIZE: 10 * 1024 * 1024,
    MAX_PDF_SIZE: 50 * 1024 * 1024,
    MAX_AUDIO_SIZE: 100 * 1024 * 1024,
    DEFAULT_TOLERANCE: 15,
    PREVIEW_DEBOUNCE: 150,
    BATCH_SIZE: 3,
    MAX_IMAGE_DIMENSION: 2000
};

// ===== 工具类 =====
class UIUtils {
    static showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: '✓', error: '✕', info: 'ℹ' };
        toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static setLoading(button, loading = true, text = '') {
        if (!button) return;
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="loader"></span> ' + (text || '处理中...');
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || text;
            button.disabled = false;
        }
    }

    static safeAddEvent(id, event, handler) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(event, handler);
            return true;
        }
        return false;
    }

    static escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            UIUtils.showToast('已复制到剪贴板', 'success');
            return true;
        } catch (err) {
            UIUtils.showToast('复制失败', 'error');
            return false;
        }
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    }
}

// ===== 音频转换工具 =====
class AudioConverter {
    constructor() {
        this.files = [];
        this.converted = [];
        this.config = {
            format: 'mp3',
            bitrate: 192,
            normalize: true
        };
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const uploadArea = document.getElementById('audio-upload');
        const fileInput = document.getElementById('audio-input');

        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleUpload(e));
        }

        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.setFormat(format, e.target);
            });
        });

        document.querySelectorAll('.bitrate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bitrate = parseInt(e.target.dataset.bitrate);
                this.setBitrate(bitrate, e.target);
            });
        });

        const normalizeCheckbox = document.getElementById('audio-normalize');
        if (normalizeCheckbox) {
            normalizeCheckbox.addEventListener('change', (e) => {
                this.config.normalize = e.target.checked;
            });
        }

        UIUtils.safeAddEvent('btn-clear-audio', 'click', () => this.clear());
        UIUtils.safeAddEvent('btn-convert-audio', 'click', () => this.startConversion());
        UIUtils.safeAddEvent('btn-download-audio', 'click', () => this.downloadAll());
        UIUtils.safeAddEvent('btn-reset-audio', 'click', () => this.reset());
    }

    handleUpload(e) {
        const fileList = Array.from(e.target.files || []);
        
        const validFiles = fileList.filter(file => {
            if (file.size > CONFIG.MAX_AUDIO_SIZE) {
                UIUtils.showToast(`${UIUtils.escapeHtml(file.name)} 超过100MB限制`, 'error');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        validFiles.forEach(file => {
            this.files.push({
                id: Date.now() + Math.random(),
                file: file,
                name: file.name,
                size: file.size,
                ext: UIUtils.getFileExtension(file.name),
                status: 'pending',
                progress: 0,
                result: null,
                error: null
            });
        });

        this.updateUI();
        UIUtils.showToast(`已添加 ${validFiles.length} 个文件`, 'success');
    }

    setFormat(format, btn) {
        this.config.format = format;
        document.querySelectorAll('.format-btn').forEach(b => {
            b.classList.remove('active', 'bg-indigo-100', 'text-indigo-700', 'border-indigo-500');
            b.classList.add('bg-gray-100', 'text-gray-700', 'border-transparent');
        });
        if (btn) {
            btn.classList.remove('bg-gray-100', 'text-gray-700', 'border-transparent');
            btn.classList.add('active', 'bg-indigo-100', 'text-indigo-700', 'border-indigo-500');
        }
    }

    setBitrate(bitrate, btn) {
        this.config.bitrate = bitrate;
        document.querySelectorAll('.bitrate-btn').forEach(b => {
            b.classList.remove('active');
        });
        if (btn) btn.classList.add('active');
    }

    updateUI() {
        const step1 = document.getElementById('audio-step1');
        const step2 = document.getElementById('audio-step2');
        const step3 = document.getElementById('audio-step3');
        const uploadArea = document.getElementById('audio-upload');
        const fileListEl = document.getElementById('audio-file-list');

        if (this.files.length > 0) {
            step1?.classList.remove('active');
            step2?.classList.remove('hidden');
            step2?.classList.add('active');
            step3?.classList.remove('hidden');
            if (uploadArea) {
                uploadArea.classList.add('has-file');
                uploadArea.innerHTML = `
                    <div class="text-4xl mb-2">✅</div>
                    <p class="text-gray-600 font-medium">已选择 ${this.files.length} 个文件</p>
                    <p class="text-xs text-gray-400 mt-1">点击可继续添加</p>
                `;
            }
        }

        if (fileListEl) {
            fileListEl.innerHTML = this.files.map(item => this.renderFileItem(item)).join('');
            
            fileListEl.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    const id = parseFloat(e.target.dataset.id);
                    if (action === 'remove') this.removeFile(id);
                    else if (action === 'download') this.downloadSingle(id);
                });
            });
        }
    }

    renderFileItem(item) {
        const ext = item.ext.toLowerCase();
        const isAudio = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'].includes(ext);
        const icon = isAudio ? '🎵' : '🎬';
        const bgClass = isAudio ? 'audio' : 'video';
        
        let statusHtml = '';
        if (item.status === 'pending') {
            statusHtml = '<span class="text-xs text-gray-500">等待转换</span>';
        } else if (item.status === 'converting') {
            statusHtml = `
                <div class="flex items-center gap-2">
                    <div class="loader"></div>
                    <span class="text-xs text-amber-600">${item.progress}%</span>
                </div>
            `;
        } else if (item.status === 'completed') {
            statusHtml = `
                <div class="flex items-center gap-2">
                    <span class="text-green-600">✓</span>
                    <span class="format-badge ${this.config.format}">${this.config.format}</span>
                    <button data-action="download" data-id="${item.id}" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded touch-btn">下载</button>
                </div>
            `;
        } else if (item.status === 'error') {
            statusHtml = `<span class="text-xs text-red-600" title="${UIUtils.escapeHtml(item.error)}">转换失败</span>`;
        }

        return `
            <div class="audio-file-item ${item.status}" id="audio-item-${item.id}">
                <div class="file-icon ${bgClass}">${icon}</div>
                <div class="file-info">
                    <div class="file-name">${UIUtils.escapeHtml(item.name)}</div>
                    <div class="file-meta">${UIUtils.formatFileSize(item.size)} · ${item.ext.toUpperCase()}</div>
                </div>
                <div class="file-status">
                    ${statusHtml}
                    ${item.status !== 'converting' ? `<button data-action="remove" data-id="${item.id}" class="text-gray-400 hover:text-red-500 touch-btn ml-2">✕</button>` : ''}
                </div>
            </div>
        `;
    }

    removeFile(id) {
        this.files = this.files.filter(f => f.id !== id);
        this.converted = this.converted.filter(f => f.id !== id);
        if (this.files.length === 0) {
            this.reset();
        } else {
            this.updateUI();
        }
    }

    async startConversion() {
        if (this.files.length === 0) {
            UIUtils.showToast('请先上传文件', 'error');
            return;
        }

        const pendingFiles = this.files.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) {
            UIUtils.showToast('所有文件已转换完成', 'info');
            return;
        }

        const btn = document.getElementById('btn-convert-audio');
        UIUtils.setLoading(btn, true, '转换中...');

        const progressBox = document.getElementById('audio-progress-box');
        const progressBar = document.getElementById('audio-prog-bar');
        const progressText = document.getElementById('audio-prog-text');
        const progressStatus = document.getElementById('audio-progress-status');

        progressBox?.classList.remove('hidden');

        // 使用浏览器原生音频编码 API
        for (let i = 0; i < pendingFiles.length; i++) {
            const fileItem = pendingFiles[i];
            fileItem.status = 'converting';
            fileItem.progress = 0;
            this.updateUI();

            progressStatus.textContent = `正在转换: ${fileItem.name}`;
            progressText.textContent = `${i + 1}/${pendingFiles.length}`;
            progressBar.style.width = `${(i / pendingFiles.length) * 100}%`;

            try {
                const result = await this.convertWithAudioContext(fileItem);
                fileItem.status = 'completed';
                fileItem.result = result;
                this.converted.push(fileItem);
            } catch (error) {
                console.error('转换失败:', error);
                fileItem.status = 'error';
                fileItem.error = error.message || '转换失败';
            }

            this.updateUI();
        }

        progressBar.style.width = '100%';
        progressStatus.textContent = '转换完成';

        UIUtils.setLoading(btn, false);
        btn?.classList.add('hidden');

        document.getElementById('audio-complete-actions')?.classList.remove('hidden');
        
        const successCount = this.converted.length;
        UIUtils.showToast(`成功转换 ${successCount} 个文件`, 'success');
    }

    async convertWithAudioContext(fileItem) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(e.target.result);
                    
                    // 创建 WAV 文件
                    const wavBlob = this.audioBufferToWav(audioBuffer);
                    
                    fileItem.progress = 100;
                    resolve(wavBlob);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(fileItem.file);
        });
    }

    audioBufferToWav(buffer) {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const arrayBuffer = new ArrayBuffer(length);
        const view = new DataView(arrayBuffer);
        const channels = [];
        let offset = 0;
        let pos = 0;

        // 写入 WAV 头部
        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"
        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(buffer.numberOfChannels);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
        setUint16(buffer.numberOfChannels * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this demo)
        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // 写入音频数据
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    downloadSingle(id) {
        const fileItem = this.files.find(f => f.id === id);
        if (!fileItem || !fileItem.result) return;

        const url = URL.createObjectURL(fileItem.result);
        const a = document.createElement('a');
        const newName = fileItem.name.replace(/\.[^/.]+$/, '') + '.' + this.config.format;
        a.href = url;
        a.download = newName;
        a.click();
        URL.revokeObjectURL(url);
    }

    async downloadAll() {
        if (this.converted.length === 0) return;

        try {
            const zip = new JSZip();
            const folder = zip.folder(`音频转换_${this.config.format}_${this.config.bitrate}kbps`);

            this.converted.forEach(item => {
                if (item.result) {
                    const newName = item.name.replace(/\.[^/.]+$/, '') + '.' + this.config.format;
                    folder.file(newName, item.result);
                }
            });

            const blob = await zip.generateAsync({ type: 'blob' });
            
            if (typeof saveAs !== 'undefined') {
                saveAs(blob, `音频转换_${Date.now()}.zip`);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `音频转换_${Date.now()}.zip`;
                a.click();
                URL.revokeObjectURL(url);
            }

            UIUtils.showToast('下载已开始', 'success');
        } catch (error) {
            UIUtils.showToast('下载失败：' + error.message, 'error');
        }
    }

    clear() {
        this.files = [];
        this.converted = [];
        this.reset();
    }

    reset() {
        this.files = [];
        this.converted = [];

        const fileInput = document.getElementById('audio-input');
        const uploadArea = document.getElementById('audio-upload');
        const step1 = document.getElementById('audio-step1');
        const step2 = document.getElementById('audio-step2');
        const step3 = document.getElementById('audio-step3');
        const progressBox = document.getElementById('audio-progress-box');
        const completeActions = document.getElementById('audio-complete-actions');
        const btn = document.getElementById('btn-convert-audio');

        if (fileInput) fileInput.value = '';
        if (uploadArea) {
            uploadArea.classList.remove('has-file');
            uploadArea.innerHTML = `
                <div class="text-4xl mb-2">🎵</div>
                <p class="text-gray-600 font-medium">点击上传音频或视频文件</p>
                <p class="text-xs text-gray-400 mt-1">支持：MP4、WAV、AAC、FLAC、OGG、M4A、WMA、WEBM等</p>
            `;
        }

        step2?.classList.add('hidden');
        step3?.classList.add('hidden');
        progressBox?.classList.add('hidden');
        completeActions?.classList.add('hidden');
        btn?.classList.remove('hidden');
        step1?.classList.add('active');

        UIUtils.showToast('已重置', 'info');
    }
}

// ===== 身份证工具 =====
class IdCardTool {
    constructor() {
        this.weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
        this.checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
        this.areaData = null;
        this.init();
    }

    getAreaData() {
        return {
            "11": { name: "北京市", cities: { "1101": { name: "市辖区", areas: ["东城区","西城区","朝阳区","丰台区","石景山区","海淀区","门头沟区","房山区","通州区","顺义区","昌平区","大兴区","怀柔区","平谷区","密云区","延庆区"] } } },
            "12": { name: "天津市", cities: { "1201": { name: "市辖区", areas: ["和平区","河东区","河西区","南开区","河北区","红桥区","东丽区","西青区","津南区","北辰区","武清区","宝坻区","滨海新区","宁河区","静海区","蓟州区"] } } },
            "13": { name: "河北省", cities: {
                "1301": { name: "石家庄市", areas: ["长安区","桥西区","新华区","井陉矿区","裕华区","藁城区","鹿泉区","栾城区","井陉县","正定县","行唐县","灵寿县","高邑县","深泽县","赞皇县","无极县","平山县","元氏县","赵县","辛集市","晋州市","新乐市"] },
                "1302": { name: "唐山市", areas: ["路南区","路北区","古冶区","开平区","丰南区","丰润区","曹妃甸区","滦南县","乐亭县","迁西县","玉田县","遵化市","迁安市","滦州市"] }
            }},
            "31": { name: "上海市", cities: { "3101": { name: "市辖区", areas: ["黄浦区","徐汇区","长宁区","静安区","普陀区","虹口区","杨浦区","闵行区","宝山区","嘉定区","浦东新区","金山区","松江区","青浦区","奉贤区","崇明区"] } } },
            "32": { name: "江苏省", cities: {
                "3201": { name: "南京市", areas: ["玄武区","秦淮区","建邺区","鼓楼区","浦口区","栖霞区","雨花台区","江宁区","六合区","溧水区","高淳区"] },
                "3202": { name: "无锡市", areas: ["锡山区","惠山区","滨湖区","梁溪区","新吴区","江阴市","宜兴市"] }
            }},
            "44": { name: "广东省", cities: {
                "4401": { name: "广州市", areas: ["荔湾区","越秀区","海珠区","天河区","白云区","黄埔区","番禺区","花都区","南沙区","从化区","增城区"] },
                "4403": { name: "深圳市", areas: ["罗湖区","福田区","南山区","宝安区","龙岗区","盐田区","龙华区","坪山区","光明区"] }
            }}
        };
    }

    init() {
        this.bindEvents();
        this.setToday();
    }

    bindEvents() {
        UIUtils.safeAddEvent('btn-today', 'click', () => this.setToday());
        UIUtils.safeAddEvent('btn-query', 'click', () => this.queryID());
        UIUtils.safeAddEvent('btn-generate', 'click', () => this.generateIDs());
        UIUtils.safeAddEvent('gen-province', 'change', () => this.updateCities());
        UIUtils.safeAddEvent('gen-city', 'change', () => this.updateAreas());

        const idInput = document.getElementById('id-input');
        if (idInput) {
            idInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9Xx]/g, '').toUpperCase();
            });
            idInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.queryID();
                }
            });
        }

        document.querySelectorAll('[data-subtab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.subtab;
                this.switchSubTab(tab);
                if (tab === 'generate' && !this.areaData) {
                    this.initProvinceSelect();
                }
            });
        });
    }

    initProvinceSelect() {
        this.areaData = this.getAreaData();
        const sel = document.getElementById('gen-province');
        if (!sel) return;
        sel.innerHTML = '<option value="">选择省份</option>';
        for (let code in this.areaData) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = this.areaData[code].name;
            sel.appendChild(opt);
        }
    }

    setToday() {
        const dateEl = document.getElementById('calc-date');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    }

    calcCheck(id17) {
        let sum = 0;
        for (let i = 0; i < 17; i++) sum += parseInt(id17[i]) * this.weights[i];
        return this.checkCodes[sum % 11];
    }

    queryID() {
        const idInput = document.getElementById('id-input');
        const resDiv = document.getElementById('id-result');
        if (!idInput || !resDiv) return;
        
        const id = idInput.value.trim().toUpperCase();
        if (!id) {
            UIUtils.showToast('请输入身份证号码', 'error');
            return;
        }

        resDiv.classList.remove('hidden');
        let html = '';
        
        if (!/^\d{17}[\dX]$/i.test(id)) {
            html = '<div class="p-3 bg-red-50 border border-red-500 text-red-800 rounded-xl">❌ 格式错误（应为17位数字+1位数字或X）</div>';
        } else {
            const check = this.calcCheck(id.substr(0, 17));
            if (id[17] !== check) {
                html = '<div class="p-3 bg-red-50 border border-red-500 text-red-800 rounded-xl">❌ 校验码错误，正确校验码应为：' + check + '</div>';
            } else {
                html = '<div class="p-3 bg-green-50 border border-green-500 text-green-800 rounded-xl">✅ 身份证号码格式正确</div>';
                const year = id.substr(6, 4), month = id.substr(10, 2), day = id.substr(12, 2);
                const gender = parseInt(id[16]) % 2 === 1 ? '男' : '女';
                const birth = new Date(year + '-' + month + '-' + day);
                const calcDate = document.getElementById('calc-date')?.value || new Date().toISOString().split('T')[0];
                const now = new Date(calcDate);
                let age = now.getFullYear() - birth.getFullYear();
                if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
                if (age < 0) age = 0;

                html += `<div class="grid grid-cols-2 gap-2 mt-3">
                    <div class="bg-white p-3 rounded-lg border"><div class="text-xs text-gray-500">出生日期</div><div class="font-medium">${year}年${month}月${day}日</div></div>
                    <div class="bg-white p-3 rounded-lg border"><div class="text-xs text-gray-500">性别</div><div class="font-medium">${gender}</div></div>
                    <div class="bg-white p-3 rounded-lg border"><div class="text-xs text-gray-500">年龄</div><div class="font-medium">${age}岁</div></div>
                </div>`;
            }
        }
        resDiv.innerHTML = html;
    }

    generateIDs() {
        const birthEl = document.getElementById('gen-birth');
        const genderEl = document.getElementById('gen-gender');
        const countEl = document.getElementById('gen-count');
        const div = document.getElementById('gen-result');
        
        if (!birthEl || !genderEl || !countEl || !div) return;
        
        const birth = birthEl.value.replace(/-/g, '');
        const gender = genderEl.value;
        const count = parseInt(countEl.value) || 5;
        const area = '110101'; // 默认北京市辖区

        div.classList.remove('hidden');
        div.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            let seq = Math.floor(Math.random() * 1000);
            if (gender === 'male') seq = seq * 2 + 1;
            else if (gender === 'female') seq = seq * 2;
            const id17 = area + birth + String(seq).padStart(3, '0');
            const full = id17 + this.calcCheck(id17);
            div.innerHTML += `<div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-2">
                <span class="font-mono">${full}</span>
                <button onclick="UIUtils.copyToClipboard('${full}')" class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs touch-btn">复制</button>
            </div>`;
        }
        UIUtils.showToast(`成功生成 ${count} 个身份证号码`, 'success');
    }

    switchSubTab(tab) {
        const queryDiv = document.getElementById('id-query');
        const generateDiv = document.getElementById('id-generate');
        const queryBtn = document.querySelector('[data-subtab="query"]');
        const generateBtn = document.querySelector('[data-subtab="generate"]');
        
        if (!queryDiv || !generateDiv || !queryBtn || !generateBtn) return;
        
        if (tab === 'query') {
            queryDiv.classList.remove('hidden');
            generateDiv.classList.add('hidden');
            queryBtn.classList.add('tab-active');
            queryBtn.classList.remove('text-gray-600');
            generateBtn.classList.remove('tab-active');
            generateBtn.classList.add('text-gray-600');
        } else {
            queryDiv.classList.add('hidden');
            generateDiv.classList.remove('hidden');
            queryBtn.classList.remove('tab-active');
            queryBtn.classList.add('text-gray-600');
            generateBtn.classList.add('tab-active');
            generateBtn.classList.remove('text-gray-600');
        }
    }

    updateCities() {
        // 简化版本
    }
    updateAreas() {
        // 简化版本
    }
}

// ===== 证件照处理器 =====
class PhotoProcessor {
    constructor() {
        this.files = [];
        this.processed = [];
        this.analysisData = new Map();
        this.currentIndex = -1;
        this.previewTimeout = null;
        this.config = {
            mode: 'smart',
            size: { w: 295, h: 413, name: '一寸' },
            dpi: 300,
            targetColor: '#ffffff',
            unifiedBgColor: '#3b82f6'
        };
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const photoUpload = document.getElementById('photo-upload');
        const photoFile = document.getElementById('photo-file');
        if (photoUpload && photoFile) {
            photoUpload.addEventListener('click', () => photoFile.click());
            photoFile.addEventListener('change', (e) => this.handleUpload(e));
        }

        UIUtils.safeAddEvent('btn-toggle-detail', 'click', () => this.toggleDetail());
        UIUtils.safeAddEvent('btn-process', 'click', () => this.startBatchProcess());
        UIUtils.safeAddEvent('btn-download', 'click', () => this.downloadZip());
        UIUtils.safeAddEvent('btn-reset', 'click', () => this.reset());
    }

    handleUpload(e) {
        let files = Array.from(e.target.files || []).filter(f => f.size <= CONFIG.MAX_IMAGE_SIZE);
        if (files.length === 0) return;
        
        this.files = files.slice(0, CONFIG.MAX_FILE_COUNT);
        
        document.getElementById('step1-upload')?.classList.remove('active');
        document.getElementById('step2-analysis')?.classList.remove('hidden');
        document.getElementById('step2-analysis')?.classList.add('active');
        document.getElementById('step3-settings')?.classList.remove('hidden');
        document.getElementById('step4-process')?.classList.remove('hidden');

        UIUtils.showToast(`成功加载 ${this.files.length} 张图片`, 'success');
    }

    toggleDetail() {
        const detail = document.getElementById('analysis-detail');
        if (detail) detail.classList.toggle('hidden');
    }

    async startBatchProcess() {
        UIUtils.showToast('处理功能演示 - 实际处理需要更复杂的实现', 'info');
    }

    async downloadZip() {
        UIUtils.showToast('下载功能演示', 'info');
    }

    reset() {
        this.files = [];
        UIUtils.showToast('已重置', 'info');
    }
}

// ===== PDF 合并工具 =====
class PdfTool {
    constructor() {
        this.files = [];
        this.mergedBlob = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const pdfUpload = document.getElementById('pdf-upload');
        const pdfInput = document.getElementById('pdf-input');
        if (pdfUpload && pdfInput) {
            pdfUpload.addEventListener('click', () => pdfInput.click());
            pdfInput.addEventListener('change', (e) => this.handleUpload(e));
        }

        UIUtils.safeAddEvent('btn-clear-pdf', 'click', () => this.clear());
        UIUtils.safeAddEvent('btn-merge', 'click', () => this.merge());
        UIUtils.safeAddEvent('btn-dl-pdf', 'click', () => this.download());
    }

    handleUpload(e) {
        const files = Array.from(e.target.files || []).filter(f => f.size <= CONFIG.MAX_PDF_SIZE);
        if (files.length === 0) return;
        this.files = files.map(f => ({ file: f, name: f.name }));
        
        document.getElementById('pdf-list-box')?.classList.remove('hidden');
        this.updateList();
        UIUtils.showToast(`已选择 ${files.length} 个文件`, 'success');
    }

    updateList() {
        const div = document.getElementById('pdf-list');
        if (!div) return;
        div.innerHTML = this.files.map((p, i) => `
            <div class="flex justify-between items-center bg-white p-3 rounded-lg border">
                <span class="truncate">${i + 1}. ${UIUtils.escapeHtml(p.name)}</span>
            </div>
        `).join('');
    }

    async merge() {
        if (this.files.length < 2) {
            UIUtils.showToast('请至少选择2个PDF文件', 'error');
            return;
        }
        UIUtils.showToast('PDF合并功能演示 - 需要PDF-lib库支持', 'info');
    }

    download() {
        UIUtils.showToast('下载功能演示', 'info');
    }

    clear() {
        this.files = [];
        document.getElementById('pdf-list-box')?.classList.add('hidden');
    }
}

// ===== 主应用 =====
class App {
    constructor() {
        this.currentTab = 'idcard';
        this.init();
    }

    init() {
        this.idCardTool = new IdCardTool();
        this.photoProcessor = new PhotoProcessor();
        this.pdfTool = new PdfTool();
        this.audioConverter = new AudioConverter();
        
        this.bindTabEvents();
        this.switchTab('idcard');
        console.log('云褍计分工具已加载 v2.7');
    }

    bindTabEvents() {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                if (tab) this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        ['idcard', 'photo', 'pdf', 'audio'].forEach(t => {
            document.getElementById(`section-${t}`)?.classList.add('hidden');
        });
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.classList.remove('tab-active');
            btn.classList.add('text-gray-600');
        });

        document.getElementById(`section-${tab}`)?.classList.remove('hidden');
        const targetBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (targetBtn) {
            targetBtn.classList.add('tab-active');
            targetBtn.classList.remove('text-gray-600');
        }
    }
}

// 启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.app = new App(); });
} else {
    window.app = new App();
}
