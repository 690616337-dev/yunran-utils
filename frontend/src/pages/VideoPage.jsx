import { useState } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  Space, 
  Typography, 
  Select,
  Alert,
  message
} from 'antd';
import { 
  UploadOutlined, 
  VideoCameraOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'avi', label: 'AVI' },
  { value: 'mkv', label: 'MKV' },
  { value: 'mov', label: 'MOV' },
  { value: 'wmv', label: 'WMV' },
];

const RESOLUTIONS = [
  { value: 'original', label: '原画' },
  { value: '720p', label: '720p (HD)' },
  { value: '1080p', label: '1080p (Full HD)' },
  { value: '4k', label: '4K (Ultra HD)' },
];

export default function VideoPage() {
  const [fileList, setFileList] = useState([]);
  const [format, setFormat] = useState('mp4');
  const [resolution, setResolution] = useState('original');

  const handleUpload = ({ fileList: newFileList }) => {
    const validFiles = newFileList.filter(file => {
      if (file.size > 500 * 1024 * 1024) {
        message.error(`${file.name} 超过 500MB 限制`);
        return false;
      }
      return true;
    });
    setFileList(validFiles);
  };

  const handleConvert = () => {
    message.info('视频转换功能开发中，敬请期待！');
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
      <Title level={2}>视频格式转换</Title>

      <Alert
        message="功能开发中"
        description="视频转换功能正在开发中，目前仅支持上传和参数选择，转换功能即将上线。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="转换设置" style={{ marginBottom: 24 }}>
        <Space size="large">
          <div>
            <Text>输出格式：</Text>
            <Select
              value={format}
              onChange={setFormat}
              style={{ width: 120, marginLeft: 8 }}
              disabled
            >
              {FORMATS.map(f => (
                <Option key={f.value} value={f.value}>{f.label}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text>分辨率：</Text>
            <Select
              value={resolution}
              onChange={setResolution}
              style={{ width: 180, marginLeft: 8 }}
              disabled
            >
              {RESOLUTIONS.map(r => (
                <Option key={r.value} value={r.value}>{r.label}</Option>
              ))}
            </Select>
          </div>
        </Space>
      </Card>

      <Card title="上传视频文件" style={{ marginBottom: 24 }}>
        <Dragger
          multiple
          accept="video/*"
          fileList={fileList}
          onChange={handleUpload}
          beforeUpload={() => false}
          showUploadList={true}
          disabled
        >
          <p className="ant-upload-drag-icon">
            <VideoCameraOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽视频文件到此处</p>
          <p className="ant-upload-hint">支持 MP4、AVI、MKV、MOV、WMV 等格式，单文件不超过 500MB</p>
        </Dragger>
      </Card>

      <Button
        type="primary"
        size="large"
        icon={<ToolOutlined />}
        disabled
        onClick={handleConvert}
      >
        开始转换（开发中）
      </Button>
    </div>
  );
}