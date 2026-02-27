import { useState } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  Space, 
  Typography, 
  Select,
  Spin,
  message,
  List,
  Progress
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined,
  AudioOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { audioApi } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const FORMATS = [
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'aac', label: 'AAC' },
  { value: 'flac', label: 'FLAC' },
  { value: 'ogg', label: 'OGG' },
];

const BITRATES = [
  { value: '64', label: '64 kbps (语音)' },
  { value: '128', label: '128 kbps (标准)' },
  { value: '192', label: '192 kbps (推荐)' },
  { value: '256', label: '256 kbps (高品质)' },
  { value: '320', label: '320 kbps (无损感)' },
];

export default function AudioPage() {
  const [fileList, setFileList] = useState([]);
  const [format, setFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('192');
  const [converting, setConverting] = useState(false);
  const [currentFile, setCurrentFile] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);

  const handleUpload = ({ fileList: newFileList }) => {
    const validFiles = newFileList.filter(file => {
      if (file.size > 100 * 1024 * 1024) {
        message.error(`${file.name} 超过 100MB 限制`);
        return false;
      }
      return true;
    });
    setFileList(validFiles);
    setResults([]);
  };

  const removeFile = (index) => {
    const newList = fileList.filter((_, i) => i !== index);
    setFileList(newList);
  };

  const handleConvert = async () => {
    if (fileList.length === 0) {
      message.error('请先上传音频文件');
      return;
    }

    setConverting(true);
    setResults([]);
    const newResults = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setCurrentFile(file.name);
      setProgress(Math.round((i / fileList.length) * 100));

      try {
        const uploadFile = file.originFileObj || file;
        const response = await audioApi.convert(uploadFile, format, bitrate);
        
        const blob = new Blob([response.data], { type: `audio/${format}` });
        const url = URL.createObjectURL(blob);
        
        const newName = file.name.replace(/\.[^/.]+$/, '') + '.' + format;
        newResults.push({
          originalName: file.name,
          newName: newName,
          url: url,
          success: true
        });
      } catch (error) {
        newResults.push({
          originalName: file.name,
          error: error.response?.data?.detail || error.message,
          success: false
        });
      }
    }

    setProgress(100);
    setResults(newResults);
    setConverting(false);
    setCurrentFile('');
    
    const successCount = newResults.filter(r => r.success).length;
    message.success(`转换完成！成功 ${successCount}/${fileList.length}`);
  };

  const handleDownload = (result) => {
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAll = () => {
    results.filter(r => r.success).forEach(result => {
      handleDownload(result);
    });
    message.success('开始批量下载');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <Title level={2}>音频格式转换</Title>

      <Card title="转换设置" style={{ marginBottom: 24 }}>
        <Space size="large">
          <div>
            <Text>输出格式：</Text>
            <Select
              value={format}
              onChange={setFormat}
              style={{ width: 120, marginLeft: 8 }}
            >
              {FORMATS.map(f => (
                <Option key={f.value} value={f.value}>{f.label}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>比特率：</Text>
            <Select
              value={bitrate}
              onChange={setBitrate}
              style={{ width: 180, marginLeft: 8 }}
            >
              {BITRATES.map(b => (
                <Option key={b.value} value={b.value}>{b.label}</Option>
              ))}
            </Select>
          </div>
        </Space>
      </Card>

      <Card title="上传音频文件" style={{ marginBottom: 24 }}>
        <Dragger
          multiple
          accept="audio/*"
          fileList={fileList}
          onChange={handleUpload}
          beforeUpload={() => false}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <AudioOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽音频文件到此处</p>
          <p className="ant-upload-hint">支持 MP3、WAV、AAC、FLAC、OGG 等格式，单文件不超过 100MB</p>
        </Dragger>

        {fileList.length > 0 && (
          <List
            style={{ marginTop: 16 }}
            dataSource={fileList}
            renderItem={(file, index) => (
              <List.Item
                actions={[
                  <Button
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFile(index)}
                    disabled={converting}
                  />
                ]}
              >
                <List.Item.Meta
                  title={file.name}
                  description={formatFileSize(file.size)}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {converting && (
        <Card style={{ marginBottom: 24 }}>
          <Progress percent={progress} status="active" />
          <Text type="secondary">正在转换: {currentFile}</Text>
        </Card>
      )}

      <Space size="large">
        <Button
          type="primary"
          size="large"
          icon={<AudioOutlined />}
          loading={converting}
          disabled={fileList.length === 0}
          onClick={handleConvert}
        >
          开始转换
        </Button>

        {results.length > 0 && results.some(r => r.success) && (
          <Button
            type="default"
            size="large"
            icon={<DownloadOutlined />}
            onClick={handleDownloadAll}
          >
            下载全部
          </Button>
        )}
      </Space>

      {results.length > 0 && (
        <Card title="转换结果" style={{ marginTop: 24 }}>
          <List
            dataSource={results}
            renderItem={(result) => (
              <List.Item
                actions={
                  result.success ? [
                    <Button
                      key="download"
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(result)}
                    >
                      下载
                    </Button>
                  ] : []
                }
              >
                <List.Item.Meta
                  title={result.originalName}
                  description={
                    result.success ? (
                      <Text type="success">✓ 转换成功: {result.newName}</Text>
                    ) : (
                      <Text type="danger">✗ 转换失败: {result.error}</Text>
                    )
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}