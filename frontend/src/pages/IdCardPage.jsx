import React, { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Button,
  Tabs,
  Form,
  Select,
  DatePicker,
  Radio,
  Alert,
  Descriptions,
  List,
  Tag,
  Space,
  message,
  Spin,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  ReloadOutlined,
  SearchOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import axios from 'axios'

const { TabPane } = Tabs
const { Option } = Select

// API基础URL
const API_BASE = 'http://127.0.0.1:8000'

const IdCardPage = () => {
  const [validateForm] = Form.useForm()
  const [generateForm] = Form.useForm()
  const [validateResult, setValidateResult] = useState(null)
  const [generatedIds, setGeneratedIds] = useState([])
  const [areas, setAreas] = useState([])
  const [loading, setLoading] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)

  // 获取地区列表
  useEffect(() => {
    fetchAreas()
  }, [])

  const fetchAreas = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/idcard/areas`)
      setAreas(res.data.areas || [])
    } catch (error) {
      console.error('获取地区列表失败:', error)
    }
  }

  // 验证身份证
  const handleValidate = async (values) => {
    setLoading(true)
    try {
      const formData = new URLSearchParams()
      formData.append('id_card', values.idCard)
      
      const res = await axios.post(`${API_BASE}/api/idcard/validate`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      
      setValidateResult(res.data)
    } catch (error) {
      message.error('验证失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  // 生成身份证
  const handleGenerate = async (values) => {
    setGenerateLoading(true)
    try {
      const formData = new URLSearchParams()
      if (values.areaCode) formData.append('area_code', values.areaCode)
      if (values.birthDate) formData.append('birth_date', values.birthDate.format('YYYY-MM-DD'))
      if (values.gender) formData.append('gender', values.gender)
      formData.append('count', values.count || 1)
      
      const res = await axios.post(`${API_BASE}/api/idcard/generate`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      
      setGeneratedIds(res.data.idCards || [])
      message.success(`成功生成 ${res.data.count} 个身份证号码`)
    } catch (error) {
      message.error('生成失败: ' + (error.response?.data?.detail || error.message))
    } finally {
      setGenerateLoading(false)
    }
  }

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  // 复制全部
  const copyAll = () => {
    if (generatedIds.length === 0) return
    const text = generatedIds.join('\n')
    navigator.clipboard.writeText(text).then(() => {
      message.success(`已复制 ${generatedIds.length} 个号码`)
    })
  }

  return (
    <div>
      <Tabs defaultActiveKey="validate" type="card">
        <TabPane 
          tab={
            <span>
              <SearchOutlined /> 查询验证
            </span>
          } 
          key="validate"
        >
          <Card title="身份证号码验证" style={{ maxWidth: 600, margin: '0 auto' }}>
            <Form
              form={validateForm}
              layout="vertical"
              onFinish={handleValidate}
            >
              <Form.Item
                name="idCard"
                label="身份证号码"
                rules={[
                  { required: true, message: '请输入身份证号码' },
                  { len: 18, message: '身份证号码必须为18位' }
                ]}
              >
                <Input 
                  placeholder="请输入18位身份证号码" 
                  maxLength={18}
                  size="large"
                />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<CheckCircleOutlined />}
                  loading={loading}
                  size="large"
                  block
                >
                  验证身份证
                </Button>
              </Form.Item>
            </Form>

            {validateResult && (
              <div style={{ marginTop: 24 }}>
                <Alert
                  message={validateResult.valid ? '验证通过' : '验证失败'}
                  type={validateResult.valid ? 'success' : 'error'}
                  showIcon
                  icon={validateResult.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  description={validateResult.message}
                  style={{ marginBottom: 16 }}
                />
                
                {validateResult.valid && (
                  <Descriptions 
                    bordered 
                    column={1}
                    size="small"
                    labelStyle={{ width: 100, backgroundColor: '#f5f5f5' }}
                  >
                    <Descriptions.Item label="归属地">
                      <Tag color="blue">{validateResult.area}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="出生日期">
                      {validateResult.birthDate}
                    </Descriptions.Item>
                    <Descriptions.Item label="性别">
                      <Tag color={validateResult.gender === '男' ? 'blue' : 'pink'}>
                        {validateResult.gender}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="年龄">
                      {validateResult.age} 岁
                    </Descriptions.Item>
                    <Descriptions.Item label="生肖">
                      {validateResult.zodiac}
                    </Descriptions.Item>
                    <Descriptions.Item label="星座">
                      {validateResult.constellation}
                    </Descriptions.Item>
                  </Descriptions>
                )}
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane 
          tab={
            <span>
              <FileTextOutlined /> 号码生成
            </span>
          } 
          key="generate"
        >
          <Card title="身份证号码生成器" style={{ maxWidth: 600, margin: '0 auto' }}>
            <Form
              form={generateForm}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{ count: 5, gender: '随机' }}
            >
              <Form.Item
                name="areaCode"
                label="地区"
              >
                <Select 
                  placeholder="选择地区（不选则随机）"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  <Option value="">随机地区</Option>
                  {areas.map(area => (
                    <Option key={area.code} value={area.code}>
                      {area.name} ({area.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="birthDate"
                label="出生日期"
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  placeholder="选择出生日期（不选则随机）"
                />
              </Form.Item>

              <Form.Item
                name="gender"
                label="性别"
              >
                <Radio.Group>
                  <Radio.Button value="">随机</Radio.Button>
                  <Radio.Button value="男">男</Radio.Button>
                  <Radio.Button value="女">女</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="count"
                label="生成数量"
                rules={[
                  { required: true, message: '请输入生成数量' },
                  { type: 'number', min: 1, max: 50, message: '数量范围 1-50' }
                ]}
              >
                <Input type="number" min={1} max={50} />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<ReloadOutlined />}
                  loading={generateLoading}
                  size="large"
                  block
                >
                  生成身份证号码
                </Button>
              </Form.Item>
            </Form>

            {generatedIds.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4>生成结果 ({generatedIds.length}个)</h4>
                  <Button icon={<CopyOutlined />} onClick={copyAll}>
                    复制全部
                  </Button>
                </div>
                
                <List
                  bordered
                  size="small"
                  dataSource={generatedIds}
                  renderItem={(id) => (
                    <List.Item
                      actions={[
                        <Button 
                          key="copy" 
                          type="link" 
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(id)}
                        >
                          复制
                        </Button>
                      ]}
                    >
                      <code style={{ fontSize: 14, fontFamily: 'monospace' }}>{id}</code>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default IdCardPage
