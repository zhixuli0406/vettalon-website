# 使用官方 Nginx 映像作為基礎映像
FROM --platform=linux/amd64 nginx:stable-alpine

# 移除 Nginx 預設的網站內容
RUN rm -rf /usr/share/nginx/html/*

# 將您的靜態檔案複製到 Nginx 的預設 HTML 目錄
COPY dist/ /usr/share/nginx/html/

# 複製自訂的 Nginx 設定檔（含安全標頭）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 告訴 Docker 容器在執行時監聽哪個連接埠
EXPOSE 80

# 啟動 Nginx 服務 (前景執行)
CMD ["nginx", "-g", "daemon off;"]