FROM python:3.7.3-slim
COPY requirements.txt /
RUN apt-get update && apt-get install -y build-essential
RUN pip3 install -r /requirements.txt
COPY . /app
WORKDIR /app
ENTRYPOINT gunicorn app:app -w 2 --threads 1 -b 0.0.0.0:8000