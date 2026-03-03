import React, { useState } from 'react'
import {
  FilePdfOutlined,
  CameraOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  IdcardOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Layout, Menu, theme } from 'antd'
import IdCardPage from './pages/IdCardPage'
import PdfMergePage from './pages/PdfMergePage'
import PhotoPage from './pages/PhotoPage'
import AudioPage from './pages/AudioPage'
import VideoPage from './pages/VideoPage'

const { Header, Sider, Content } = Layout

const menuItems = [
  {
    key: 'idcard',
    icon: <IdcardOutlined />,
    label: '身份证工具',
  },
  {
    key: 'pdf',
    icon: <FilePdfOutlined />,
    label: 'PDF合并',
  },
  {
    key: 'photo',
    icon: <CameraOutlined />,
    label: '证件照抠图',
  },
  {
    key: 'audio',
    icon: <AudioOutlined />,
    label: '音频转换',
  },
  {
    key: 'video',
    icon: <VideoCameraOutlined />,
    label: '视频转换',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '设置',
  },
]

const App = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('idcard')
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const renderContent = () => {
    switch (selectedKey) {
      case 'idcard':
        return <IdCardPage />
      case 'pdf':
        return <PdfMergePage />
      case 'photo':
        return <PhotoPage />
      case 'audio':
        return <AudioPage />
      case 'video':
        return <VideoPage />
      case 'settings':
        return (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <h2>设置</h2>
            <p>云褍实用工具 v3.0.0</p>
            <p>Electron + React + FastAPI</p>
          </div>
        )
      default:
        return <IdCardPage />
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            color: '#1677ff',
          }}
        >
          {collapsed ? '云褍' : '云褍工具'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find(item => item.key === selectedKey)?.label || '云褍实用工具'}
          </div>
          <div style={{ color: '#999', fontSize: 14 }}>
            v3.0.0
          </div>
        </Header>
        
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
