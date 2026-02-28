import { useState } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  Space, 
  Typography, 
  Radio,
  Spin,
  message,
  Row,
  Col,
  Image
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { removeBackground, changeBackground } from '../api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const BG_COLORS = [
  { value: '#FFFFFF', label: '白色', class: 'bg-white' },
  { value: '#3B82F6', label: '蓝色', class: 'bg-blue' },
  { value: '#EF4444', label: '红色', class: 'bg-red' },
  { value: '#22C55E', label: '绿色', class: 'bg-green' },
];

export default function PhotoPage() {
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [processedPreview, setProcessedPreview] = useState(null);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleUpload = ({ fileList }) => {
    if (fileList.length > 0) {
      const uploadedFile = fileList[0];
      setFile(uploadedFile);
      
      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalPreview(e.target.result);
      };
      reader.readAsDataURL(uploadedFile.originFileObj || uploadedFile);
      
      setProcessedPreview(null);
      message.success('图片上传成功');
    }
  };

  const handleRemoveBg = async () => {
    if (!file) {
      message.error('请先上传图片');
      return;
    }

    setProcessing(true);
    try {
      const uploadFile = file.originFileObj || file;
      const response = await removeBackground(uploadFile);
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setProcessedPreview(url);
      message.success('抠图完成！');
    } catch (error) {
      message.error('抠图失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleChangeBg = async () => {
    if (!file) {
      message.error('请先上传图片');
      return;
    }

    setProcessing(true);
    try {
      const uploadFile = file.originFileObj || file;
      const response = await changeBackground(uploadFile, bgColor);
      
      const blob = new Blob([response.data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setProcessedPreview(url);
      message.success('背景更换完成！');
    } catch (error) {
      message.error('处理失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedPreview) return;
    
    const a = document.createElement('a');
    a.href = processedPreview;
    a.download = `证件照_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    message.success('下载已开始');
  };

  return (
    <div>
      <Title level={2}>证件照智能处理</Title>

      <Row gutter={24}>
        <Col span={12}>
          <Card title="上传照片" style={{ marginBottom: 24 }}>
            <Dragger
              accept="image/*"
              maxCount={1}
              fileList={file ? [file] : []}
              onChange={handleUpload}
              beforeUpload={() => false}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽照片到此处</p>
              <p className="ant-upload-hint">支持 JPG、PNG 格式</p>
            </Dragger>

            {originalPreview && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">原图预览：</Text>
                <Image
                  src={originalPreview}
                  alt="原图"
                  style={{ maxWidth: '100%', marginTop: 8 }}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title="处理结果" style={{ marginBottom: 24 }}>
            {processing ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>正在处理中...</p>
              </div>
            ) : processedPreview ? (
              <div>
                <Image
                  src={processedPreview}
                  alt="处理结果"
                  style={{ maxWidth: '100%' }}
                />
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                  style={{ marginTop: 16, width: '100%' }}
                >
                  下载结果
                </Button>
              </div>
            ) : (
              <div style={{ 
                height: 200, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f5f5f5',
                borderRadius: 8
              }}>
                <Text type="secondary">处理后的图片将显示在这里</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="背景设置" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>选择背景色：</Text>
            <Radio.Group 
              value={bgColor} 
              onChange={(e) => setBgColor(e.target.value)}
              style={{ marginLeft: 16 }}
            >
              <Space>
                {BG_COLORS.map(color => (
                  <Radio.Button 
                    key={color.value} 
                    value={color.value}
                    style={{
                      background: color.value,
                      color: color.value === '#FFFFFF' ? '#000' : '#fff',
                      border: `2px solid ${bgColor === color.value ? '#1890ff' : '#d9d9d9'}`,
                      minWidth: 80,
                      textAlign: 'center'
                    }}
                  >
                    {color.label}
                  </Radio.Button>
                ))}
              </Space>
            </Radio.Group>
          </div>

          <Space>
            <Button
              type="primary"
              size="large"
              onClick={handleRemoveBg}
              loading={processing}
              disabled={!file}
            >
              AI 智能抠图
            </Button>
            
            <Button
              type="default"
              size="large"
              icon={<BgColorsOutlined />}
              onClick={handleChangeBg}
              loading={processing}
              disabled={!file}
            >
              更换背景色
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
}