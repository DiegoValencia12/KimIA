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

Para cambiar de modelo, edita `OLLAMA_MODEL` en el `.env`, descarga el nuevo modelo con `ollama pull <modelo>` y ejecuta `docker compose up -d backend`. El modelo se envía también al agente de n8n, así que no hay que cambiarlo en n8n.

---

## 3.1 Agente de n8n (opcional)

Por defecto el backend llama directo a Ollama (`USE_N8N_AGENT=false` en `.env`). Para usar el agente de n8n:

1. Abre [http://localhost:5678](http://localhost:5678) y crea la cuenta de propietario (es local, sirve cualquier correo).
2. El flujo `KimIA` se importa solo desde `n8n/workflows/KimIA.json`. Ábrelo.
3. En el nodo **Ollama Chat Model** crea la credencial con URL `http://ollama:11434`.
4. Activa el flujo con el interruptor **Active**.
5. En `.env` pon `USE_N8N_AGENT=true` y ejecuta `docker compose up -d backend`.

Las credenciales y la cuenta de n8n no viajan en Git; cada instalación las crea una vez.

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