# 가벼운 Nginx 이미지를 기반으로 사용합니다.
FROM nginx:alpine

# 1. 기존 기본 설정 파일 삭제
RUN rm /etc/nginx/conf.d/default.conf

# 2. 우리가 만든 커스텀 설정 파일 복사
COPY default.conf /etc/nginx/conf.d/default.conf

# 3. 소스코드 전체 복사
COPY . /usr/share/nginx/html

# 컨테이너의 80번 포트를 개방합니다.
EXPOSE 80

# Nginx를 실행합니다.
CMD ["nginx", "-g", "daemon off;"]