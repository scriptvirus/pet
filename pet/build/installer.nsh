; 自定义 NSIS 安装脚本
; 这个文件会被 electron-builder 包含到安装程序中

; 安装完成后的操作
!macro customInstall
  ; 创建桌面快捷方式
  CreateShortCut "$DESKTOP\桌面宠物.lnk" "$INSTDIR\桌面宠物.exe" "" "$INSTDIR\桌面宠物.exe" 0
  
  ; 设置开机自启动（可选）
  ; WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "DesktopPet" "$INSTDIR\桌面宠物.exe"
!macroend

; 卸载时的操作
!macro customUnInstall
  ; 删除桌面快捷方式
  Delete "$DESKTOP\桌面宠物.lnk"
  
  ; 删除开机自启动项
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "DesktopPet"
  
  ; 删除用户数据（可选，谨慎使用）
  ; RMDir /r "$APPDATA\desktop-pet"
!macroend