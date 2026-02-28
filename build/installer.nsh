; NSIS 安装脚本扩展
; 用于 Windows 安装器的自定义逻辑

!macro customInit
  ; 初始化时检查是否已安装旧版本
!macroend

!macro customInstall
  ; 安装完成后创建必要的目录
  CreateDirectory "$INSTDIR\resources\backend\temp"
  
  ; 写入卸载信息
  WriteRegStr HKCU "Software\yunran-tools-v3" "InstallPath" "$INSTDIR"
!macroend

!macro customUnInstall
  ; 卸载时清理用户数据（可选）
  ; Delete "$LOCALAPPDATA\yunran-tools-v3\*"
!macroend
