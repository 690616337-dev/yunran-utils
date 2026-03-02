import { useState, useRef } from 'react';
import { 
  Card, 
  Upload, 
  Button, 
  List, 
  Space, 
  Typography, 
  Progress,
  message,
  InputNumber,
  Checkbox,
  Tooltip
} from 'antd';
import { 
  UploadOutlined, 
  MergeCellsOutlined, 
  DownloadOutlined,
  PrinterOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  CopyOutlined,
  MinusOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { mergePdf } from '../api';

const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function PdfMergePage() {
  const [fileList, setFileList] = useState([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mergedBlob, setMergedBlob] = useState(null);
  const [enableCopies, setEnableCopies] = useState(false);
  const iframeRef = useRef(null);

  const handleUpload = ({ fileList: newFileList }) => {
    const validFiles = newFileList.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        message.error(`${file.name} 超过 50MB 限制`);
        return false;
      }
      return file.type === 'application/pdf' || file.name.endsWith('.pdf');
    }).map(file => ({
      ...file,
      copies: 1, // 默认份数
    }));
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

  const updateCopies = (index, copies) => {
    const newList = [...fileList];
    newList[index] = { ...newList[index], copies: Math.max(1, Math.min(99, copies)) };
    setFileList(newList);
  };

  const handleMerge = async () => {
    if (fileList.length < 1) {
      message.error('请至少选择 1 个 PDF 文件');
      return;
    }

    setMerging(true);
    setProgress(0);

    try {
      // 根据份数展开文件列表
      const expandedFiles = [];
      fileList.forEach(file => {
        const copies = enableCopies ? (file.copies || 1) : 1;
        for (let i = 0; i < copies; i++) {
          expandedFiles.push(file.originFileObj || file);
        }
      });
      
      console.log(`合并 ${fileList.length} 个文件，展开后共 ${expandedFiles.length} 份`);
      
      const response = await mergePdf(expandedFiles, (p) => setProgress(p));
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      setMergedBlob(blob);
      message.success(`PDF 合并成功！共 ${expandedFiles.length} 份内容`);
    } catch (error) {
      console.error('合并错误:', error);
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
    
    // 使用 iframe 打印
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        iframe.contentWindow.print();
        message.success('打印窗口已打开');
      } catch (e) {
        // 如果跨域，尝试在新窗口打开
        window.open(url, '_blank');
        message.info('已在浏览器中打开，请使用 Ctrl+P 打印');
      }
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 60000);
    };
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
          title={
            <Space>
              <span>已选择 {fileList.length} 个文件</span>
              <Checkbox 
                checked={enableCopies}
                onChange={(e) => setEnableCopies(e.target.checked)}
              >
                启用份数设置
              </Checkbox>
            </Space>
          }
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
                {enableCopies && (
                  <Space>
                    <Text type="secondary">份数:</Text>
                    <Button 
                      size="small" 
                      icon={<MinusOutlined />}
                      onClick={() => updateCopies(index, (file.copies || 1) - 1)}
                    />
                    <InputNumber
                      min={1}
                      max={99}
                      value={file.copies || 1}
                      onChange={(val) => updateCopies(index, val)}
                      style={{ width: 60 }}
                      size="small"
                    />
                    <Button 
                      size="small" 
                      icon={<PlusOutlined />}
                      onClick={() => updateCopies(index, (file.copies || 1) + 1)}
                    />
                  </Space>
                )}
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
          disabled={fileList.length < 1}
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
