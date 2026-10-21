# KimIA

KimIA - Instalación y ejecución con Docker

## 1. Windows

### Requisitos
* Docker Desktop instalado y en ejecución.
* Git instalado.
* Archivo `.env` configurado en la raíz del proyecto.

### Descargar proyecto
```bash
git clone URL_DEL_REPOSITORIO
cd KimIA
```

### Descargar imágenes de Docker
```bash
docker pull mongo:8
docker pull ollama/ollama:latest
docker pull n8nio/n8n:latest
docker pull node:22-alpine
```

### Construir y levantar servicios
```bash
docker compose up -d --build
```

### Verificar servicios
```bash
docker compose ps
```

### Detener servicios
```bash
docker compose down
```

---

## 2. Linux

### Requisitos
* Docker Engine instalado y en ejecución.
* Docker Compose v2 instalado.
* Git instalado.
* Archivo `.env` configurado en la raíz del proyecto.

### Descargar proyecto
```bash
git clone URL_DEL_REPOSITORIO
cd KimIA
```

### Descargar imágenes de Docker
```bash
docker pull mongo:8
docker pull ollama/ollama:latest
docker pull n8nio/n8n:latest
docker pull node:22-alpine
```

### Construir y levantar servicios
```bash
docker compose up -d --build
```

### Verificar servicios
```bash
docker compose ps
```

### Detener servicios
```bash
docker compose down
```

---

## 3. Descargar el modelo de Ollama

Después de iniciar los servicios, descarga el modelo utilizado por KimIA:

```bash
docker exec KimIA-ollama ollama pull qwen3:0.6b
```

---

## 4. Servicios disponibles

Una vez levantados los contenedores, puedes acceder a los servicios en las siguientes direcciones:

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend:** [http://localhost:3000](http://localhost:3000)
* **MongoDB:** `localhost:27017`
* **Ollama:** [http://localhost:11434](http://localhost:11434)
* **n8n:** [http://localhost:5678](http://localhost:5678)

---

## 5. Notas

* Reemplaza `URL_DEL_REPOSITORIO` por la dirección real de tu repositorio.
* Configura el archivo `.env` antes de iniciar los servicios.
* El comando `docker compose up -d --build` descargará las imágenes necesarias si no están disponibles localmente y construirá las imágenes del proyecto.
* El comando `docker compose down` detiene los servicios y conserva los volúmenes de datos.
* **Importante:** No utilices `docker compose down -v` si deseas conservar los datos almacenados en tus bases de datos o servicios.
