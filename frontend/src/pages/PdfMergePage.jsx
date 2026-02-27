import { useState, useRef } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  List, 
  Space, 
  Typography, 
  Progress,
  message 
} from 'antd';
import { 
  UploadOutlined, 
  MergeCellsOutlined, 
  DownloadOutlined,
  PrinterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { pdfApi } from '../api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function PdfMergePage() {
  const [fileList, setFileList] = useState([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mergedBlob, setMergedBlob] = useState(null);
  const iframeRef = useRef(null);

  const handleUpload = ({ fileList: newFileList }) => {
    const validFiles = newFileList.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        message.error(`${file.name} 超过 50MB 限制`);
        return false;
      }
      return file.type === 'application/pdf' || file.name.endsWith('.pdf');
    });
    setFileList(validFiles);
    setMergedBlob(null);
  };

  const moveFile = (index, direction) => {
    const newList = [...fileList];
    if (direction === 'up' && index > 0) {
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    } else if (direction === 'down' && index < newList.length - 1) {
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    }
    setFileList(newList);
  };

  const removeFile = (index) => {
    const newList = fileList.filter((_, i) => i !== index);
    setFileList(newList);
    if (newList.length === 0) {
      setMergedBlob(null);
    }
  };

  const handleMerge = async () => {
    if (fileList.length < 2) {
      message.error('请至少选择 2 个 PDF 文件');
      return;
    }

    setMerging(true);
    setProgress(0);

    try {
      const files = fileList.map(f => f.originFileObj || f);
      const response = await pdfApi.merge(files);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setMergedBlob(blob);
      message.success('PDF 合并成功！');
    } catch (error) {
      message.error('合并失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `合并_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('下载已开始');
  };

  const handlePrint = () => {
    if (!mergedBlob) return;
    
    const url = URL.createObjectURL(mergedBlob);
    
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
      message.info('已在浏览器中打开，请使用 Ctrl+P 打印');
    } else {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => printWindow.print();
        message.success('打印窗口已打开');
      } else {
        message.warning('弹窗被阻止，请下载后打印');
        handleDownload();
      }
    }
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
      <Title level={2}>PDF 合并工具</Title>
      
      <Card title="上传 PDF 文件" style={{ marginBottom: 24 }}>
        <Dragger
          multiple
          accept=".pdf"
          fileList={fileList}
          onChange={handleUpload}
          beforeUpload={() => false}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽 PDF 文件到此处</p>
          <p className="ant-upload-hint">支持多选，单文件不超过 50MB</p>
        </Dragger>
      </Card>

      {fileList.length > 0 && (
        <Card 
          title={`已选择 ${fileList.length} 个文件`}
          extra={
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => { setFileList([]); setMergedBlob(null); }}
            >
              清空
            </Button>
          }
          style={{ marginBottom: 24 }}
        >
          <List
            dataSource={fileList}
            renderItem={(file, index) => (
              <List.Item
                actions={[
                  <Button
                    key="up"
                    icon={<ArrowUpOutlined />}
                    disabled={index === 0}
                    onClick={() => moveFile(index, 'up')}
                  />,
                  <Button
                    key="down"
                    icon={<ArrowDownOutlined />}
                    disabled={index === fileList.length - 1}
                    onClick={() => moveFile(index, 'down')}
                  />,
                  <Button
                    key="delete"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeFile(index)}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={<FilePdfOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />}
                  title={file.name}
                  description={formatFileSize(file.size)}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {merging && (
        <Card style={{ marginBottom: 24 }}>
          <Progress percent={progress} status="active" />
          <Text type="secondary">正在合并 PDF 文件...</Text>
        </Card>
      )}

      <Space size="large">
        <Button
          type="primary"
          size="large"
          icon={<MergeCellsOutlined />}
          loading={merging}
          disabled={fileList.length < 2}
          onClick={handleMerge}
        >
          合并 PDF
        </Button>

        {mergedBlob && (
          <>
            <Button
              type="default"
              size="large"
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              下载
            </Button>
            <Button
              type="default"
              size="large"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              打印
            </Button>
          </>
        )}
      </Space>

      <iframe ref={iframeRef} style={{ display: 'none' }} />
    </div>
  );
}