import { useState } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  Space, 
  Typography, 
  Radio,
  message,
  List,
  Badge,
  Progress,
  Image
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined,
  BgColorsOutlined,
  DeleteOutlined,
  PictureOutlined,
  ClearOutlined
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
  const [fileList, setFileList] = useState([]);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleUpload = ({ fileList: newFileList }) => {
    const filesWithStatus = newFileList.map(file => ({
      ...file,
      status: 'pending',
      result: null,
      errorMsg: null,
    }));
    setFileList(filesWithStatus);
  };

  const removeFile = (uid) => {
    setFileList(prev => prev.filter(f => f.uid !== uid));
  };

  const clearAll = () => {
    setFileList([]);
    setCurrentIndex(-1);
  };

  const processAll = async (processType = 'remove') => {
    if (fileList.length === 0) {
      message.error('请先上传图片');
      return;
    }

    setProcessing(true);
    const total = fileList.length;
    
    for (let i = 0; i < total; i++) {
      setCurrentIndex(i);
      const file = fileList[i];
      
      if (file.status === 'done') continue;

      setFileList(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'processing' } : f
      ));

      try {
        const uploadFile = file.originFileObj || file;
        let response;
        
        if (processType === 'remove') {
          response = await removeBackground(uploadFile);
        } else {
          response = await changeBackground(uploadFile, bgColor);
        }
        
        const blob = new Blob([response.data], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        
        setFileList(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'done', result: url } : f
        ));
      } catch (error) {
        console.error(`处理失败 ${file.name}:`, error);
        setFileList(prev => prev.map((f, idx) => 
          idx === i ? { 
            ...f, 
            status: 'error', 
            errorMsg: error.response?.data?.detail || error.message 
          } : f
        ));
      }
    }

    setProcessing(false);
    setCurrentIndex(-1);
    
    const successCount = fileList.filter(f => f.status === 'done').length;
    if (successCount > 0) {
      message.success(`成功处理 ${successCount} 张图片`);
    }
  };

  const handleDownload = (file) => {
    if (!file.result) return;
    
    const a = document.createElement('a');
    a.href = file.result;
    a.download = `证件照_${file.name.split('.')[0]}_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    message.success(`${file.name} 下载已开始`);
  };

  const handleDownloadAll = () => {
    const completedFiles = fileList.filter(f => f.status === 'done' && f.result);
    if (completedFiles.length === 0) {
      message.warning('没有可下载的图片');
      return;
    }

    completedFiles.forEach((file, index) => {
      setTimeout(() => handleDownload(file), index * 500);
    });
    
    message.success(`开始下载 ${completedFiles.length} 张图片`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge status="default" text="待处理" />;
      case 'processing': return <Badge status="processing" text="处理中" />;
      case 'done': return <Badge status="success" text="已完成" />;
      case 'error': return <Badge status="error" text="失败" />;
      default: return null;
    }
  };

  return (
    <div>
      <Title level={2}>证件照智能处理</Title>

      <Card title="批量上传照片" style={{ marginBottom: 24 }}>
        <Dragger
          multiple
          accept="image/*"
          fileList={fileList}
          onChange={handleUpload}
          beforeUpload={() => false}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽照片到此处</p>
          <p className="ant-upload-hint">支持批量上传 JPG、PNG 格式，单文件不超过 20MB</p>
        </Dragger>
      </Card>

      {fileList.length > 0 && (
        <>
          <Card 
            title={`已上传 ${fileList.length} 张照片`}
            extra={
              <Button danger icon={<ClearOutlined />} onClick={clearAll}>
                清空全部
              </Button>
            }
            style={{ marginBottom: 24 }}
          >
            {processing && (
              <Progress 
                percent={Math.round(((currentIndex + 1) / fileList.length) * 100)} 
                status="active"
                style={{ marginBottom: 16 }}
              />
            )}
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={fileList}
              renderItem={(file, index) => (
                <List.Item>
                  <Card 
                    size="small"
                    title={getStatusBadge(file.status)}
                    cover={
                      file.result ? (
                        <Image
                          src={file.result}
                          alt={file.name}
                          style={{ height: 150, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ 
                          height: 150, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: '#f5f5f5'
                        }}>
                          <PictureOutlined style={{ fontSize: 40, color: '#ccc' }} />
                        </div>
                      )
                    }
                    actions={[
                      file.status === 'done' && (
                        <Button 
                          key="download" 
                          type="link" 
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(file)}
                        >
                          下载
                        </Button>
                      ),
                      <Button 
                        key="delete" 
                        type="link" 
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFile(file.uid)}
                      >
                        删除
                      </Button>
                    ].filter(Boolean)}
                  >
                    <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Card>

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
                  onClick={() => processAll('remove')}
                  loading={processing}
                  disabled={fileList.length === 0}
                >
                  AI 智能抠图
                </Button>
                
                <Button
                  type="default"
                  size="large"
                  icon={<BgColorsOutlined />}
                  onClick={() => processAll('change')}
                  loading={processing}
                  disabled={fileList.length === 0}
                >
                  更换背景色
                </Button>

                <Button
                  type="default"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadAll}
                  disabled={!fileList.some(f => f.status === 'done')}
                >
                  下载全部
                </Button>
              </Space>
            </Space>
          </Card>
        </>
      )}
    </div>
  );
}
