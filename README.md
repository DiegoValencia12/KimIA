# KimIA

KimIA - Instalación y ejecución con Docker

1. Windows

Requisitos

- Docker Desktop instalado y en ejecución.
- Git instalado.
- Archivo .env configurado en la raíz del proyecto.

Descargar proyecto

- git clone URL_DEL_REPOSITORIO
- cd KimIA

Descargar imágenes de Docker

- docker pull mongo:8
- docker pull ollama/ollama:latest
- docker pull n8nio/n8n:latest
- docker pull node:22-alpine

Construir y levantar servicios

- docker compose up -d --build

Verificar servicios

- docker compose ps

- Detener servicios

- docker compose down


2. Linux

Requisitos

- Docker Engine instalado y en ejecución.
- Docker Compose v2 instalado.
- Git instalado.
- Archivo .env configurado en la raíz del proyecto.

Descargar proyecto

git clone URL_DEL_REPOSITORIO
cd KimIA

Descargar imágenes de Docker

- docker pull mongo:8
- docker pull ollama/ollama:latest
- docker pull n8nio/n8n:latest
- docker pull node:22-alpine

Construir y levantar servicios

- docker compose up -d --build

Verificar servicios

- docker compose ps

Detener servicios

- docker compose down


3. Descargar el modelo de Ollama

Después de iniciar los servicios, descargar el modelo utilizado por KimIA:

- docker exec KimIA-ollama ollama pull qwen3:0.6b


4. Servicios disponibles

Frontend: http://localhost:5173
Backend: http://localhost:3000
MongoDB: localhost:27017
Ollama: http://localhost:11434
n8n: http://localhost:5678


5. Notas

- Reemplazar URL_DEL_REPOSITORIO por la dirección real del repositorio.
- Configurar el archivo .env antes de iniciar los servicios.
- docker compose up -d --build descarga las imágenes necesarias si no están disponibles localmente y construye las imágenes del proyecto.
- docker compose down detiene los servicios y conserva los volúmenes.
- No utilizar docker compose down -v si se quieren conservar los datos.